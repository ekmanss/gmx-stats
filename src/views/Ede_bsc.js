import cx from "classnames";
import moment from "moment";
import { useMemo, useState } from "react";
import { RiLoader5Fill } from "react-icons/ri";
import { formatNumber } from "./helpers";

// import PoolAmountChart from "./components/PoolAmountChart";
// import AUMAndELPSupplySection from "./EdeSections/AUMandELPSupplySection";
// import AumDailyUsageSection from "./EdeSections/AumDailyUsageSection";
// import AUMPerformanceAnnualizedSection from "./EdeSections/AUMPerformanceAnnualizedSection";
// import BorrowingRateAnnualizedSection from "./EdeSections/BorrowingRateAnnualizedSection";
// import FeesChartSection from "./EdeSections/FeesChartSection";
// import NewAndExistingUsers from "./EdeSections/NewAndExistingUsers";
// import NewEsbtUsersSection from "./EdeSections/NewEsbtUsersSection";
// import NewUsersSection from "./EdeSections/NewUsersSection";
// import OpenInterestSection from "./EdeSections/OpenInterestSection";
// import TradersNetPnLSection from "./EdeSections/TradersNetPnLSection";
// import TradersProfitLossChartSection from "./EdeSections/TradersProfitLossChartSection";
// import UniqueUsersSection from "./EdeSections/UniqueUsersSection";
// import UserActions from "./EdeSections/UserActions";
// import VolumeChartSection from "./EdeSections/VolumeChartSection";
//
// import DateRangeSelect from "../components/DateRangeSelect";
import {
  // TestParse,
  // // useVolumeDataFromServer,
  // useFeesData,
  // useGlpData,
  // useLastBlock,
  // useLastSubgraphBlock,
  // useTotalVolumeFromServer,
  // useTradersData,
  // useUsersData,
} from "./dataProvider";

function Home(props) {
  const { mode } = props

  const NOW = Math.floor(Date.now() / 1000);
  const DEFAULT_GROUP_PERIOD = 86400;
  const [groupPeriod] = useState(DEFAULT_GROUP_PERIOD);
  const [dataRange, setDataRange] = useState({
    fromValue: moment().subtract(2, "month").toDate(),
    toValue: null,
  });

  // const { data: lastSubgraphBlock, error: lastSubgraphBlockError } =
  //   useLastSubgraphBlock();


  return (
    <div className="Home">
      <div className="chart-grid">

      </div>
    </div>
  );
}

export default Home;
