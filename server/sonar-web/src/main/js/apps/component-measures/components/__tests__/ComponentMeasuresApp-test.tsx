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
import { shallow } from 'enzyme';
import * as React from 'react';
import { getMeasuresWithPeriod } from '../../../../api/measures';
import ScreenPositionHelper from '../../../../components/common/ScreenPositionHelper';
import { Alert } from '../../../../components/ui/Alert';
import { mockMainBranch, mockPullRequest } from '../../../../helpers/mocks/branch-like';
import { mockComponent } from '../../../../helpers/mocks/component';
import { mockIssue, mockLocation, mockRouter } from '../../../../helpers/testMocks';
import { waitAndUpdate } from '../../../../helpers/testUtils';
import { ComponentQualifier } from '../../../../types/component';
import { ComponentMeasuresApp } from '../ComponentMeasuresApp';

jest.mock('../../../../api/metrics', () => ({
  getAllMetrics: jest.fn().mockResolvedValue([
    {
      id: '1',
      key: 'lines_to_cover',
      type: 'INT',
      name: 'Lines to Cover',
      domain: 'Coverage',
    },
    {
      id: '2',
      key: 'coverage',
      type: 'PERCENT',
      name: 'Coverage',
      domain: 'Coverage',
    },
    {
      id: '3',
      key: 'duplicated_lines_density',
      type: 'PERCENT',
      name: 'Duplicated Lines (%)',
      domain: 'Duplications',
    },
    {
      id: '4',
      key: 'new_bugs',
      type: 'INT',
      name: 'New Bugs',
      domain: 'Reliability',
    },
  ]),
}));

jest.mock('../../../../api/measures', () => ({
  getMeasuresWithPeriod: jest.fn(),
}));

beforeEach(() => {
  (getMeasuresWithPeriod as jest.Mock).mockResolvedValue({
    component: { measures: [{ metric: 'coverage', value: '80.0' }] },
    period: { mode: 'previous_version' },
  });
});

it('should render correctly', async () => {
  const wrapper = shallowRender();
  expect(wrapper.find('.spinner')).toHaveLength(1);
  await waitAndUpdate(wrapper);
  expect(wrapper).toMatchSnapshot();
});

it('should render a measure overview', async () => {
  const wrapper = shallowRender({
    location: mockLocation({ pathname: '/component_measures', query: { metric: 'Reliability' } }),
  });
  expect(wrapper.find('.spinner')).toHaveLength(1);
  await waitAndUpdate(wrapper);
  expect(wrapper.find('MeasureOverviewContainer')).toHaveLength(1);
});

it('should render a message when there are no measures', async () => {
  (getMeasuresWithPeriod as jest.Mock).mockResolvedValue({
    component: { measures: [] },
    period: { mode: 'previous_version' },
  });
  const wrapper = shallowRender();
  await waitAndUpdate(wrapper);
  expect(wrapper).toMatchSnapshot();
});

it('should not render drilldown for estimated duplications', async () => {
  const wrapper = shallowRender({ branchLike: mockPullRequest({ title: '' }) });
  await waitAndUpdate(wrapper);
  expect(wrapper).toMatchSnapshot();
});

it('should refresh branch status if issues are updated', async () => {
  const fetchBranchStatus = jest.fn();
  const branchLike = mockPullRequest();
  const wrapper = shallowRender({ branchLike, fetchBranchStatus });
  const instance = wrapper.instance();
  await waitAndUpdate(wrapper);

  instance.handleIssueChange(mockIssue());
  expect(fetchBranchStatus).toHaveBeenCalledWith(branchLike, 'foo');
});

it('should render a warning message when user does not have access to all projects whithin a Portfolio', async () => {
  const wrapper = shallowRender({
    component: mockComponent({
      qualifier: ComponentQualifier.Portfolio,
      canBrowseAllChildProjects: false,
    }),
  });
  await waitAndUpdate(wrapper);
  expect(wrapper.find(ScreenPositionHelper).dive()).toMatchSnapshot(
    'Measure menu with warning (ScreenPositionHelper)'
  );
});

it.each([
  [ComponentQualifier.Portfolio, true, false],
  [ComponentQualifier.Project, false, false],
  [ComponentQualifier.Portfolio, false, true],
])(
  'should not render a warning message',
  async (
    componentQualifier: ComponentQualifier,
    canBrowseAllChildProjects: boolean,
    alertIsVisible: boolean
  ) => {
    const wrapper = shallowRender({
      component: mockComponent({
        qualifier: componentQualifier,
        canBrowseAllChildProjects,
      }),
    });
    await waitAndUpdate(wrapper);
    expect(wrapper.find(ScreenPositionHelper).dive().find(Alert).exists()).toBe(alertIsVisible);
  }
);

function shallowRender(props: Partial<ComponentMeasuresApp['props']> = {}) {
  return shallow<ComponentMeasuresApp>(
    <ComponentMeasuresApp
      branchLike={mockMainBranch()}
      component={mockComponent({ key: 'foo', name: 'Foo' })}
      fetchBranchStatus={jest.fn()}
      location={mockLocation({ pathname: '/component_measures', query: { metric: 'coverage' } })}
      router={mockRouter()}
      {...props}
    />
  );
}
