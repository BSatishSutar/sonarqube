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
package org.sonar.db.scim;

import java.util.List;
import javax.annotation.CheckForNull;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.session.RowBounds;

public interface ScimUserMapper {

  List<ScimUserDto> findAll();

  @CheckForNull
  ScimUserDto findByScimUuid(@Param("scimUserUuid") String scimUserUuid);

  @CheckForNull
  ScimUserDto findByUserUuid(@Param("userUuid") String userUuid);

  void insert(@Param("scimUserDto") ScimUserDto scimUserDto);

  List<ScimUserDto> findScimUsers(@Param("query") ScimUserQuery scimUserQuery, RowBounds rowBounds);

  int countScimUsers(@Param("query") ScimUserQuery scimUserQuery);

  void deleteByUserUuid(@Param("userUuid") String userUuid);

  void deleteByScimUuid(@Param("scimUuid") String scimUuid);
}
