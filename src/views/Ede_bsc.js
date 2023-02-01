import React, { useEffect, useState, useMemo } from 'react';
import cx from "classnames";
import moment from "moment/moment";
import DateRangeSelect from "../components/DateRangeSelect";
import {useLastBlock, useLastSubgraphBlock} from "../dataProvider";

import { formatNumber } from "./helpers";
import {
  useTotalVolumeFromServer,
  useFeesData
} from "./dataProvider";
import {RiLoader5Fill} from "react-icons/ri";

function Home(props) {


  const [lastSubgraphBlock, , lastSubgraphBlockError] = useLastSubgraphBlock()
  const [lastBlock] = useLastBlock()
  const isObsolete = lastSubgraphBlock && lastBlock && lastBlock.timestamp - lastSubgraphBlock.timestamp > 3600
  const onDateRangeChange = (dates) => {
    const [start, end] = dates;
    setDataRange({ fromValue: start, toValue: end })
  };
  const dateRangeOptions = [{
    label: "Last Month",
    id: 1
  }, {
    label: "Last 2 Months",
    id: 2,
    isDefault: true
  }, {
    label: "Last 3 Months",
    id: 3,
  }, {
    label: "All time",
    id: 4
  }]
  const [dataRange, setDataRange] = useState({ fromValue: moment().subtract(2, 'month').toDate(), toValue: null })

  //totalVolumeDataLoading
  const { data: totalVolumeData, loading: totalVolumeDataLoading } =
    useTotalVolumeFromServer();

  //totalFee
  const [totalFeesData, totalFeesLoading] = useFeesData({});
  const [totalFees, totalFeesDelta] = useMemo(() => {
    if (!totalFeesData) {
      return [];
    }
    const total = totalFeesData[totalFeesData.length - 1]?.cumulative;
    const delta = total - totalFeesData[totalFeesData.length - 2]?.cumulative;
    return [total, delta];
  }, [totalFeesData]);


  return (
    <div className="Home">
      <div className="page-title-section">
        <div className="page-title-block">
          <h1>EDE bsc</h1>
          {lastSubgraphBlock && lastBlock &&
            <p className={cx('page-description', { warning: isObsolete })}>
              {isObsolete && "Data is obsolete. "}
              Updated {moment(lastSubgraphBlock.timestamp * 1000).fromNow()}
              &nbsp;at block <a rel="noreferrer" target="_blank" href={`https://arbiscan.io/block/${lastSubgraphBlock.number}`}>{lastSubgraphBlock.number}</a>
            </p>
          }
          {
            lastSubgraphBlockError &&
            <p className="page-description warning">
              Subgraph data is temporarily unavailable.
            </p>
          }
        </div>
        <div className="form">
          <DateRangeSelect options={dateRangeOptions} startDate={dataRange.fromValue} endDate={dataRange.toValue} onChange={onDateRangeChange} />
        </div>
      </div>
      <div className="chart-grid">

        <div className="chart-cell stats">
          {totalVolumeDataLoading ? (
              <RiLoader5Fill size="3em" className="loader" />
            ) :(
            <>
              <div className="total-stat-label">Total Volume</div>
              <div className="total-stat-value">
                {formatNumber(
                  totalVolumeData?.volumeStats[0].cumulative / 1e30,
                  {
                    currency: true,
                  }
                )}
              </div>
            </>
            )

          }
        </div>
        <div className="chart-cell stats">
          {totalFees ? <>
            <div className="total-stat-label">Total Fees</div>
            <div className="total-stat-value">
              {formatNumber(totalFees, { currency: true })}
              <span className="total-stat-delta plus" title="Change since previous day">+{formatNumber(totalFeesDelta, { currency: true, compact: true })}</span>
            </div>
          </> : (totalFeesLoading ? <RiLoader5Fill size="3em" className="loader" /> : null)}
        </div>


      </div>
    </div>
  );
}

export default Home;
