import GenericChart from "../components/GenericChart";
import { useFundingRateData } from "../dataProvider";
import { tooltipFormatterPercent, yaxisFormatterPercent } from "../helpers";

const BorrowingRateAnnualizedSection = ({ params }) => {
  const [fundingRateData, fundingRateLoading] = useFundingRateData(params);

  return (
    <div className="chart-cell">
      <GenericChart
        loading={fundingRateLoading}
        title="Borrowing Rate Annualized"
        data={fundingRateData}
        yaxisDataKey="ETH"
        yaxisTickFormatter={yaxisFormatterPercent}
        tooltipFormatter={tooltipFormatterPercent}
        items={[{ key: "ETH" }, { key: "BTC" }, { key: "BUSD" }]}
        type="Line"
        yaxisDomain={[0, 90 /* ~87% is a maximum yearly borrow rate */]}
        isCoinChart={true}
      />
    </div>
  );
};

export default BorrowingRateAnnualizedSection;
