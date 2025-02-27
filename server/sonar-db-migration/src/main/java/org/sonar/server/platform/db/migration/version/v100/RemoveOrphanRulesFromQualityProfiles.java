/*
 * SonarQube
 * Copyright (C) 2009-2023 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
package org.sonar.server.platform.db.migration.version.v100;

import java.sql.SQLException;
import org.sonar.api.utils.System2;
import org.sonar.core.util.UuidFactory;
import org.sonar.db.Database;
import org.sonar.server.platform.db.migration.step.DataChange;
import org.sonar.server.platform.db.migration.step.Select;
import org.sonar.server.platform.db.migration.step.Upsert;

public class RemoveOrphanRulesFromQualityProfiles extends DataChange {

  private final UuidFactory uuidFactory;
  private final System2 system2;

  public RemoveOrphanRulesFromQualityProfiles(Database db, UuidFactory uuidFactory, System2 system2) {
    super(db);
    this.uuidFactory = uuidFactory;
    this.system2 = system2;
  }

  @Override
  protected void execute(Context context) throws SQLException {
    Select select = context.prepareSelect("select ar.uuid, ar.profile_uuid, ar.rule_uuid from rules_profiles rp " +
      "inner join active_rules ar on ar.profile_uuid = rp.uuid " +
      "inner join rules r on r.uuid = ar.rule_uuid " +
      "where rp.language != r.language");
    select.scroll(row -> process(context, row));
  }

  private void process(Context context, Select.Row row) throws SQLException {
    Upsert insertQualityProfileChange = insertQualityProfileChange(context, row);
    Upsert deleteActiveRule = deleteActiveRule(context, row);
    insertQualityProfileChange.commit();
    deleteActiveRule.commit();
  }

  private Upsert insertQualityProfileChange(Context context, Select.Row row) throws SQLException {
    return context.prepareUpsert("INSERT INTO qprofile_changes " +
        "(kee, rules_profile_uuid, change_type, created_at, user_uuid, change_data) " +
        "VALUES(?, ?, ?, ?, ?, ?);")
      .setString(1, uuidFactory.create())
      .setString(2, row.getString(2))
      .setString(3, "DEACTIVATED")
      .setLong(4, system2.now())
      .setString(5, null)
      .setString(6, "ruleUuid=" + row.getString(3))
      .execute();
  }

  private static Upsert deleteActiveRule(Context context, Select.Row row) throws SQLException {
    return context.prepareUpsert("delete from active_rules where uuid = ?")
      .setString(1, row.getString(1))
      .execute();
  }
}
