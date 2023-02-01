import GenericChart from "../components/GenericChart";
import { useEsbtUserData } from "../dataProvider";
import {
  COLORS,
  tooltipFormatterNumber,
  tooltipLabelFormatterUnits,
  yaxisFormatterNumber,
} from "../helpers";

const NewEsbtUsers = ({ params }) => {
  const [usersData, usersLoading] = useEsbtUserData(params);
  console.log("usersData esbt: ", usersData);

  return (
    <div className="chart-cell">
      <GenericChart
        syncId="syncEsbtUser"
        loading={usersLoading}
        title="New ESBT Users"
        data={usersData?.map((item) => ({
          ...item,
          all: item.cumulativeNewUserCount,
        }))}
        truncateYThreshold={6000}
        yaxisDataKey="tally"
        rightYaxisDataKey="cumulativeNewUserCount" // 折线
        yaxisTickFormatter={yaxisFormatterNumber}
        tooltipFormatter={tooltipFormatterNumber}
        tooltipLabelFormatter={tooltipLabelFormatterUnits}
        items={[
          { key: "tally", name: "new users" },
          {
            key: "cumulativeNewUserCount",
            name: "Cumulative",
            type: "Line",
            yAxisId: "right",
            strokeWidth: 2,
            color: COLORS[4],
          },
        ]}
        type="Composed"
      />
    </div>
  );
};

export default NewEsbtUsers;
