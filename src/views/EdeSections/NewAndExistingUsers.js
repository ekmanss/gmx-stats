import GenericChart from "../components/GenericChart";
import { useUsersData } from "../dataProvider";
import {
  COLORS,
  tooltipFormatterNumber,
  tooltipLabelFormatterUnits,
  yaxisFormatterNumber,
} from "../helpers";

const NewAndExistingUsers = ({ params }) => {
  const [usersData, usersLoading] = useUsersData(params);

  return (
    <div className="chart-cell">
      <GenericChart
        syncId="syncGlp"
        loading={usersLoading}
        title="New vs. Existing Users"
        data={usersData?.map((item) => ({
          ...item,
          all: item.uniqueCount,
        }))}
        truncateYThreshold={7000}
        yaxisDataKey="uniqueCount"
        rightYaxisDataKey="oldPercent"
        yaxisTickFormatter={yaxisFormatterNumber}
        tooltipFormatter={tooltipFormatterNumber}
        tooltipLabelFormatter={tooltipLabelFormatterUnits}
        items={[
          { key: "newCount", name: "New" },
          { key: "oldCount", name: "Existing" },
          {
            key: "oldPercent",
            name: "Existing %",
            yAxisId: "right",
            type: "Line",
            strokeWidth: 2,
            color: COLORS[4],
            unit: "%",
          },
        ]}
        type="Composed"
      />
    </div>
  );
};

export default NewAndExistingUsers;
