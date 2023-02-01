import GenericChart from "../components/GenericChart";
import { useUsersData } from "../dataProvider";
import {
  tooltipFormatterNumber,
  tooltipLabelFormatterUnits,
  yaxisFormatterNumber,
} from "../helpers";

const UserActions = ({ params }) => {
  const [usersData, usersLoading] = useUsersData(params);

  return (
    <div className="chart-cell">
      <GenericChart
        syncId="syncGlp"
        loading={usersLoading}
        title="User Actions"
        data={(usersData || []).map((item) => ({
          ...item,
          all: item.actionCount,
        }))}
        truncateYThreshold={25000}
        yaxisDataKey="actionCount"
        yaxisTickFormatter={yaxisFormatterNumber}
        tooltipFormatter={tooltipFormatterNumber}
        tooltipLabelFormatter={tooltipLabelFormatterUnits}
        items={[
          { key: "actionSwapCount", name: "Swaps" },
          { key: "actionMarginCount", name: "Margin trading" },
          { key: "actionMintBurnCount", name: "Mint & Burn ELP" },
        ]}
        type="Composed"
      />
    </div>
  );
};

export default UserActions;
