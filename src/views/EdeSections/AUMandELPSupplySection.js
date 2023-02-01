import ChartWrapper from "../components/ChartWrapper";

import {
  CHART_HEIGHT,
  COLORS,
  tooltipFormatterNumber,
  tooltipLabelFormatter,
  yaxisFormatter,
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
import { useGlpData } from "../dataProvider";
const AUMAndELPSupplySection = ({ params }) => {
  const [glpData, glpLoading] = useGlpData(params);

  return (
    <div className="chart-cell">
      <ChartWrapper
        title="AUM & Elp Supply"
        loading={glpLoading}
        data={glpData}
        csvFields={[{ key: "aum" }, { key: "elpSupply" }]}
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={glpData} syncId="syncGlp">
            <CartesianGrid strokeDasharray="10 10" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={tooltipLabelFormatter}
              minTickGap={30}
            />
            <YAxis
              dataKey="glpSupply"
              tickFormatter={yaxisFormatter}
              width={YAXIS_WIDTH}
            />
            <Tooltip
              formatter={tooltipFormatterNumber}
              labelFormatter={tooltipLabelFormatter}
              contentStyle={{ textAlign: "left" }}
            />
            <Legend />
            <Line
              isAnimationActive={false}
              type="monotone"
              strokeWidth={2}
              unit="$"
              dot={false}
              dataKey="aum"
              stackId="a"
              name="AUM"
              stroke={COLORS[0]}
            />
            <Line
              isAnimationActive={false}
              type="monotone"
              strokeWidth={2}
              dot={false}
              dataKey="glpSupply"
              stackId="a"
              name="Elp Supply"
              stroke={COLORS[1]}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
};

export default AUMAndELPSupplySection;
