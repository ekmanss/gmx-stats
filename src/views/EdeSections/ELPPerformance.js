import ChartWrapper from "../components/ChartWrapper";
import {
  useFeesData,
  useGlpData,
  useGlpPerformanceData,
} from "../dataProvider";

import {
  CHART_HEIGHT,
  COLORS,
  tooltipFormatterNumber,
  tooltipLabelFormatter,
  yaxisFormatterNumber,
  YAXIS_WIDTH,
} from "../helpers";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ELPPerformance = ({ params }) => {
  const [feesData] = useFeesData(params);
  const [glpData, glpLoading] = useGlpData(params);
  const [glpPerformanceData] = useGlpPerformanceData(glpData, feesData, params);

  return (
    <div className="chart-cell">
      <ChartWrapper
        title="Elp Performance"
        loading={glpLoading}
        data={glpPerformanceData}
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={glpPerformanceData} syncId="syncGlp">
            <CartesianGrid strokeDasharray="10 10" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={tooltipLabelFormatter}
              minTickGap={30}
            />
            <YAxis
              dataKey="performanceSyntheticCollectedFees"
              domain={[80, 180]}
              unit="%"
              tickFormatter={yaxisFormatterNumber}
              width={YAXIS_WIDTH}
            />
            <Tooltip
              formatter={tooltipFormatterNumber}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{ textAlign: "left" }}
            />
            <Legend />
            <Line
              dot={false}
              isAnimationActive={false}
              type="monotone"
              unit="%"
              dataKey="performanceLpBtcCollectedFees"
              name="% LP BTC-BUSD (w/ fees)"
              stroke={COLORS[2]}
            />
            <Line
              dot={false}
              isAnimationActive={false}
              type="monotone"
              unit="%"
              dataKey="performanceLpEthCollectedFees"
              name="% LP ETH-BUSD (w/ fees)"
              stroke={COLORS[4]}
            />
            <Line
              dot={false}
              isAnimationActive={false}
              type="monotone"
              unit="%"
              dataKey="performanceSyntheticCollectedFees"
              name="% Index (w/ fees)"
              stroke={COLORS[0]}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-description">
          <p>
            <span style={{ color: COLORS[0] }}>% of Index (with fees)</span> is
            Elp with fees / Index Price * 100. Index is a basket of 25% BTC, 25%
            ETH, 50% BUSD rebalanced once&nbsp;a&nbsp;day
            <br />
            <span style={{ color: COLORS[4] }}>
              % of LP ETH-BUSD (with fees)
            </span>{" "}
            is Elp Price with fees / LP ETH-BUSD * 100
            <br />
          </p>
        </div>
      </ChartWrapper>
    </div>
  );
};

export default ELPPerformance;
