import GenericChart from "../components/GenericChart";
import { useUsersData } from "../dataProvider";
import {
  tooltipFormatterNumber,
  tooltipLabelFormatterUnits,
  yaxisFormatterNumber,
} from "../helpers";

const UniqueUsersSection = ({ params }) => {
  const [usersData, usersLoading] = useUsersData(params);

  return (
    <div className="chart-cell">
      <GenericChart
        syncId="syncGlp"
        loading={usersLoading}
        title="Unique Users"
        data={usersData}
        truncateYThreshold={6500}
        yaxisDataKey="uniqueSum"
        yaxisTickFormatter={yaxisFormatterNumber}
        tooltipFormatter={tooltipFormatterNumber}
        tooltipLabelFormatter={tooltipLabelFormatterUnits}
        items={[
          { key: "uniqueSwapCount", name: "Swaps" },
          { key: "uniqueMarginCount", name: "Margin trading" },
          { key: "uniqueMintBurnCount", name: "Mint & Burn ELP" },
        ]}
        type="Composed"
      />
    </div>
  );
};

export default UniqueUsersSection;
