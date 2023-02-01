import VolumeChart from "../components/VolumeChart";
import { useVolumeDataRequest } from "../dataProvider";
import {
  CHART_HEIGHT,
  tooltipFormatter,
  tooltipLabelFormatter,
  yaxisFormatter,
  YAXIS_WIDTH,
} from "../helpers";

const VolumeChartSection = ({ params }) => {
  const [volumeData, volumeLoading] = useVolumeDataRequest(params);
  return (
    <div className="chart-cell">
      <VolumeChart
        data={volumeData}
        loading={volumeLoading}
        chartHeight={CHART_HEIGHT}
        yaxisWidth={YAXIS_WIDTH}
        xaxisTickFormatter={tooltipLabelFormatter}
        yaxisTickFormatter={yaxisFormatter}
        tooltipLabelFormatter={tooltipLabelFormatter}
        tooltipFormatter={tooltipFormatter}
      />
    </div>
  );
};

export default VolumeChartSection;
