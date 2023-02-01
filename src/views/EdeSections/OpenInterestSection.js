import GenericChart from "../components/GenericChart";
import { useTradersData } from "../dataProvider";

import { convertToPercents } from "../helpers";
const OpenInterestSection = ({ params }) => {
  const [tradersData, tradersLoading] = useTradersData(params);

  return (
    <div className="chart-cell">
      <GenericChart
        loading={tradersLoading}
        title="Open Interest"
        data={tradersData?.data.map((item) => ({
          all: item.openInterest,
          ...item,
        }))}
        controls={{
          convertToPercents: convertToPercents,
        }}
        yaxisDataKey="all"
        items={[
          { key: "shortOpenInterest", name: "Short", color: "#f93333" },
          { key: "longOpenInterest", name: "Long", color: "#22c761" },
        ]}
        type="Bar"
      />
    </div>
  );
};

export default OpenInterestSection;
