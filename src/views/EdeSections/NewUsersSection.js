import GenericChart from "../components/GenericChart";
import { useUsersData } from "../dataProvider";
import {
  COLORS,
  tooltipFormatterNumber,
  tooltipLabelFormatterUnits,
  yaxisFormatterNumber,
} from "../helpers";

const NewUsersSection = ({ params }) => {
  const [usersData, usersLoading] = useUsersData(params);
  console.log("usersData: ", usersData);

  return (
    <div className="chart-cell">
      <GenericChart
        syncId="syncGlp"
        loading={usersLoading}
        title="New Users"
        data={usersData?.map((item) => ({ ...item, all: item.newCount }))}
        truncateYThreshold={6000}
        yaxisDataKey="newCount"
        rightYaxisDataKey="uniqueCountCumulative"
        yaxisTickFormatter={yaxisFormatterNumber}
        tooltipFormatter={tooltipFormatterNumber}
        tooltipLabelFormatter={tooltipLabelFormatterUnits}
        items={[
          { key: "newSwapCount", name: "Swap" },
          { key: "newMarginCount", name: "Margin trading" },
          { key: "newMintBurnCount", name: "Mint & Burn" },
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

export default NewUsersSection;
