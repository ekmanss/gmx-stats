import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartWrapper from "../components/ChartWrapper";
import { useTradersData } from "../dataProvider";

import {
  CHART_HEIGHT,
  COLORS,
  tooltipFormatter,
  tooltipLabelFormatter,
  yaxisFormatter,
  YAXIS_WIDTH,
} from "../helpers";
const TradersNetPnLSection = ({ params }) => {
  const [tradersData, tradersLoading] = useTradersData(params);

  return (
    <div className="chart-cell">
      <ChartWrapper
        title="Traders Net PnL"
        loading={tradersLoading}
        data={tradersData?.data}
        csvFields={[
          { key: "pnl", name: "Net PnL" },
          { key: "pnlCumulative", name: "Cumulative PnL" },
        ]}
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <ComposedChart data={tradersData?.data} syncId="tradersId">
            <CartesianGrid strokeDasharray="10 10" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={tooltipLabelFormatter}
              minTickGap={30}
            />
            <YAxis
              domain={[
                -tradersData?.stats.maxAbsCumulativePnl * 1.05,
                tradersData?.stats.maxAbsCumulativePnl * 1.05,
              ]}
              orientation="right"
              yAxisId="right"
              tickFormatter={yaxisFormatter}
              width={YAXIS_WIDTH}
              tick={{ fill: COLORS[4] }}
            />
            <YAxis
              domain={[
                -tradersData?.stats.maxAbsPnl * 1.05,
                tradersData?.stats.maxAbsPnl * 1.05,
              ]}
              tickFormatter={yaxisFormatter}
              width={YAXIS_WIDTH}
            />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{ textAlign: "left" }}
            />
            <Legend />
            <Bar
              type="monotone"
              //   fill={mode == "dark" ? "#FFFFFF" : "#000000"}
              fill={"#000000"}
              dot={false}
              dataKey="pnl"
              name="Net PnL"
            >
              {(tradersData?.data || []).map((item, i) => {
                return (
                  <Cell
                    key={`cell-${i}`}
                    fill={item.pnl > 0 ? "#22c761" : "#f93333"}
                  />
                );
              })}
            </Bar>
            <Line
              type="monotone"
              strokeWidth={2}
              stroke={COLORS[4]}
              dataKey="currentPnlCumulative"
              name="Cumulative PnL"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-description">
          <p>Considers settled (closed) positions</p>
          <p>Fees are not factored into PnL</p>
        </div>
      </ChartWrapper>
    </div>
  );
};

export default TradersNetPnLSection;
