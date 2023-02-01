import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client";
import fetch from "cross-fetch";
import * as ethers from "ethers";
import { request } from "graphql-request";
import { chain, maxBy, minBy, sortBy, sumBy } from "lodash";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import GlpManager from "./abis/GlpManager.json";
import RewardReader from "./abis/RewardReader.json";
import Token from "./abis/Token.json";
import { BSCTest, getAddress } from "./addresses";

const { JsonRpcProvider } = ethers.providers;

const httpFetcher = (url) => fetch(url).then((res) => res.json());

const gqlFetcher = (query) =>
  request("https://api.thegraph.com/subgraphs/name/aaronlux/ede-stats", query);

const oldFetcher = (query) =>
  request("https://api.thegraph.com/subgraphs/name/aaronlux/ede-graph", query);

const providers = {
  bscTest: new JsonRpcProvider("https://bsc-dataseed3.binance.org/"),
};

const provider = new JsonRpcProvider("https://bsc-dataseed3.binance.org/");

function getProvider(chainName) {
  if (!(chainName in providers)) {
    throw new Error(`Unknown chain ${chainName}`);
  }
  return providers[chainName];
}

function getChainId(chainName) {
  const chainId = {
    bscTest: BSCTest,
  }[chainName];

  if (!chainId) {
    throw new Error(`Unknown chain ${chainName}`);
  }
  return chainId;
}

const NOW_TS = parseInt(Date.now() / 1000);
const FIRST_DATE_TS = parseInt(new Date("2022-12-8") / 1000);
// const FIRST_DATE_TS = 1670457600
function fillNa(arr) {
  const prevValues = {};
  let keys;
  if (arr.length > 0) {
    keys = Object.keys(arr[0]);
    delete keys.timestamp;
    delete keys.id;
  }

  for (const el of arr) {
    for (const key of keys) {
      if (!el[key]) {
        if (prevValues[key]) {
          el[key] = prevValues[key];
        }
      } else {
        prevValues[key] = el[key];
      }
    }
  }
  return arr;
}

export async function queryEarnData(chainName, account) {
  const provider = getProvider(chainName);
  const chainId = getChainId(chainName);
  const rewardReader = new ethers.Contract(
    getAddress(chainId, "RewardReader"),
    RewardReader.abi,
    provider
  );
  const glpContract = new ethers.Contract(
    getAddress(chainId, "GLP"),
    Token.abi,
    provider
  );
  const glpManager = new ethers.Contract(
    getAddress(chainId, "GlpManager"),
    GlpManager.abi,
    provider
  );

  let depositTokens;
  let rewardTrackersForDepositBalances;
  let rewardTrackersForStakingInfo;

  depositTokens = [
    "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
    "0xf42Ae1D54fd613C9bb14810b0588FaAa09a426cA",
  ];
  rewardTrackersForDepositBalances = [
    "0x908C4D94D34924765f1eDc22A1DD098397c59dD4",
    "0x908C4D94D34924765f1eDc22A1DD098397c59dD4",
  ];
  rewardTrackersForStakingInfo = [
    "0x908C4D94D34924765f1eDc22A1DD098397c59dD4",
    "0x4d268a7d4C16ceB5a606c173Bd974984343fea13",
  ];
  // TODO  自己的token

  const [balances, stakingInfo, glpTotalSupply, glpAum, gmxPrice] =
    await Promise.all([
      rewardReader.getDepositBalances(
        account,
        depositTokens,
        rewardTrackersForDepositBalances
      ),
      rewardReader
        .getStakingInfo(account, rewardTrackersForStakingInfo)
        .then((info) => {
          return rewardTrackersForStakingInfo.map((_, i) => {
            return info.slice(i * 5, (i + 1) * 5);
          });
        }),
      glpContract.totalSupply(),
      glpManager.getAumInUsdg(true),
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=gmx&vs_currencies=usd"
      ).then(async (res) => {
        const j = await res.json();
        return j["gmx"]["usd"];
      }),
    ]);

  const glpPrice = glpAum / 1e18 / (glpTotalSupply / 1e18);
  const now = new Date();

  return {
    GLP: {
      stakedGLP: balances[5] / 1e18,
      pendingETH: stakingInfo[4][0] / 1e18,
      pendingEsGMX: stakingInfo[3][0] / 1e18,
      glpPrice,
    },
    GMX: {
      stakedGMX: balances[0] / 1e18,
      stakedEsGMX: balances[1] / 1e18,
      pendingETH: stakingInfo[2][0] / 1e18,
      pendingEsGMX: stakingInfo[0][0] / 1e18,
      gmxPrice,
    },
    timestamp: parseInt(now / 1000),
    datetime: now.toISOString(),
  };
}

export const tokenSymbols = {
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c": "BTC",
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8": "ETH",
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "BNB",
  "0xe9e7cea3dedca5984780bafc599bd69add087d56": "BUSD",
};

const knownSwapSources = {
  bscTest: {
    "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064": "GMX", // Router
    "0x1a0ad27350cccd6f7f168e052100b4960efdb774": "GMX", // FastPriceFeed
    "0x3b6067d4caa8a14c63fdbe6318f27a0bbc9f9237": "Dodo",
  },
  bsc: {
    "0x6f9aae42c4bfa604f91795dd50aed643766afb84": "GMX", // Router
  },
};

export function useRequest(url, defaultValue, fetcher = httpFetcher) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [data, setData] = useState(defaultValue);

  const fetchData = async (second) => {
    try {
      setLoading(true);
      const data = await fetcher(url);
      setData(data);
    } catch (ex) {
      console.error(ex);
      setError(ex);
    }
    setLoading(false);
  };

  fetchData();
  return [data, loading, error];
}

export function TestParse() {
  const url = "https://api.coingecko.com/api/v3/coins";
  const { data, error } = useSWR(url, httpFetcher);
  let loading = !error && !data;

  if (error) {
    console.log("TestParse error: ", error);
  }
  if (data) {
    console.log("TestParse data: ", data);
  }

  if (loading) {
    console.log("TestParse loading: ", loading);
  }
  return [data, loading, error];
}

export function useCoingeckoPrices(symbol, { from = FIRST_DATE_TS } = {}) {
  // token ids https://api.coingecko.com/api/v3/coins
  const _symbol = {
    BTC: "bitcoin",
    ETH: "ethereum",
  }[symbol];

  const now = Date.now() / 1000;
  const days = Math.ceil(now / 86400) - Math.ceil(from / 86400) - 1;

  const url = `https://api.coingecko.com/api/v3/coins/${_symbol}/market_chart?vs_currency=usd&days=${days}&interval=daily`;

  const { data: res, error } = useSWR(url, httpFetcher);
  let loading = !error && !res;

  const data = useMemo(() => {
    if (!res || res.length === 0) {
      return null;
    }

    const ret = res.prices.map((item) => {
      // -1 is for shifting to previous day
      // because CG uses first price of the day, but for GLP we store last price of the day
      const timestamp = item[0] - 1;
      const groupTs = parseInt(timestamp / 1000 / 86400) * 86400;
      return {
        timestamp: groupTs,
        value: item[1],
      };
    });
    return ret;
  }, [res]);

  return [data, loading, error];
}

function getImpermanentLoss(change) {
  return (2 * Math.sqrt(change)) / (1 + change) - 1;
}

export function useGraph(querySource) {
  const query = gql(querySource);
  const graphEndpoint =
    "https://api.thegraph.com/subgraphs/name/aaronlux/ede-stats";
  const client = new ApolloClient({
    link: new HttpLink({ uri: graphEndpoint, fetch }),
    cache: new InMemoryCache(),
  });
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
  }, [querySource, setLoading]);

  useEffect(() => {
    client
      .query({ query })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((ex) => {
        console.warn(
          "Subgraph request failed error: %s subgraphUrl: %s",
          ex.message,
          graphEndpoint
        );
        setError(ex);
        setLoading(false);
      });
  }, [querySource, setData, setError, setLoading]);

  return [data, loading, error];
}

export function useLastBlock() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    provider
      .getBlock()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  return [data, loading, error];
}

export const useLastSubgraphBlock = () => {
  const query = `
    {
        _meta {
          block {
            number
          }
        }
      }
    `;
  const { data, error } = useSWR(query, gqlFetcher);
  return {
    data: data,
    loading: !error && !data,
    error: error,
  };
};

export function useTradersData({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  chainName = "bsc",
} = {}) {
  const query = `{
    tradingStats(
      first: 1000
      orderBy: timestamp
      orderDirection: desc
      where: { period: "daily", timestamp_gte: ${from}, timestamp_lte: ${to} }
      subgraphError: allow
    ) {
      timestamp
      profit
      loss
      profitCumulative
      lossCumulative
      longOpenInterest
      shortOpenInterest
    }
  }`;
  console.log("useTradersData query: ", query);
  const [closedPositionsData, loading, error] = useGraph(query);
  const [feesData] = useFeesData({ from, to, chainName });
  const marginFeesByTs = useMemo(() => {
    if (!feesData) {
      return {};
    }

    let feesCumulative = 0;
    return feesData.reduce((memo, { timestamp, margin: fees }) => {
      feesCumulative += fees;
      memo[timestamp] = {
        fees,
        feesCumulative,
      };
      return memo;
    }, {});
  }, [feesData]);

  let ret = null;
  let currentPnlCumulative = 0;
  let currentProfitCumulative = 0;
  let currentLossCumulative = 0;
  const data = closedPositionsData
    ? sortBy(closedPositionsData.tradingStats, (i) => i.timestamp).map(
        (dataItem) => {
          const longOpenInterest = dataItem.longOpenInterest / 1e30;
          const shortOpenInterest = dataItem.shortOpenInterest / 1e30;
          const openInterest = longOpenInterest + shortOpenInterest;

          // const fees = (marginFeesByTs[dataItem.timestamp]?.fees || 0)
          // const feesCumulative = (marginFeesByTs[dataItem.timestamp]?.feesCumulative || 0)

          const profit = dataItem.profit / 1e30;
          const loss = dataItem.loss / 1e30;
          const profitCumulative = dataItem.profitCumulative / 1e30;
          const lossCumulative = dataItem.lossCumulative / 1e30;
          const pnlCumulative = profitCumulative - lossCumulative;
          const pnl = profit - loss;
          currentProfitCumulative += profit;
          currentLossCumulative -= loss;
          currentPnlCumulative += pnl;
          return {
            longOpenInterest,
            shortOpenInterest,
            openInterest,
            profit,
            loss: -loss,
            profitCumulative,
            lossCumulative: -lossCumulative,
            pnl,
            pnlCumulative,
            timestamp: dataItem.timestamp,
            currentPnlCumulative,
            currentLossCumulative,
            currentProfitCumulative,
          };
        }
      )
    : null;

  if (data) {
    console.log("debug data: ", JSON.stringify(data));
    console.log(
      "debug data maxBy: ",
      JSON.stringify(maxBy(data, (item) => item.profit))
    );
    const maxProfit = maxBy(data, (item) => item.profit).profit;
    const maxLoss = minBy(data, (item) => item.loss).loss;
    const maxProfitLoss = Math.max(maxProfit, -maxLoss);

    const maxPnl = maxBy(data, (item) => item.pnl).pnl;
    const minPnl = minBy(data, (item) => item.pnl).pnl;
    const maxCurrentCumulativePnl = maxBy(
      data,
      (item) => item.currentPnlCumulative
    ).currentPnlCumulative;
    const minCurrentCumulativePnl = minBy(
      data,
      (item) => item.currentPnlCumulative
    ).currentPnlCumulative;

    const currentProfitCumulative =
      data[data.length - 1].currentProfitCumulative;
    const currentLossCumulative = data[data.length - 1].currentLossCumulative;
    const stats = {
      maxProfit,
      maxLoss,
      maxProfitLoss,
      currentProfitCumulative,
      currentLossCumulative,
      maxCurrentCumulativeProfitLoss: Math.max(
        currentProfitCumulative,
        -currentLossCumulative
      ),

      maxAbsPnl: Math.max(Math.abs(maxPnl), Math.abs(minPnl)),
      maxAbsCumulativePnl: Math.max(
        Math.abs(maxCurrentCumulativePnl),
        Math.abs(minCurrentCumulativePnl)
      ),
    };

    ret = {
      data,
      stats,
    };
  }

  return [ret, loading];
}

function getSwapSourcesFragment(skip = 0, from, to) {
  return `
    hourlyVolumeBySources(
      first: 1000
      skip: ${skip}
      orderBy: timestamp
      orderDirection: desc
      where: { timestamp_gte: ${from}, timestamp_lte: ${to} }
      subgraphError: allow
    ) {
      timestamp
      source
      swap
    }
  `;
}
export function useSwapSources({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  chainName = "bsc",
} = {}) {
  const query = `{
    a: ${getSwapSourcesFragment(0, from, to)}
    b: ${getSwapSourcesFragment(1000, from, to)}
    c: ${getSwapSourcesFragment(2000, from, to)}
    d: ${getSwapSourcesFragment(3000, from, to)}
    e: ${getSwapSourcesFragment(4000, from, to)}
  }`;
  const [graphData, loading, error] = useGraph(query, { chainName });

  let data = useMemo(() => {
    if (!graphData) {
      return null;
    }

    const { a, b, c, d, e } = graphData;
    const all = [...a, ...b, ...c, ...d, ...e];

    const totalVolumeBySource = a.reduce((acc, item) => {
      const source = knownSwapSources[chainName][item.source] || item.source;
      if (!acc[source]) {
        acc[source] = 0;
      }
      acc[source] += item.swap / 1e30;
      return acc;
    }, {});
    const topVolumeSources = new Set(
      Object.entries(totalVolumeBySource)
        .sort((a, b) => b[1] - a[1])
        .map((item) => item[0])
        .slice(0, 30)
    );

    let ret = chain(all)
      .groupBy((item) => parseInt(item.timestamp / 86400) * 86400)
      .map((values, timestamp) => {
        let all = 0;
        const retItem = {
          timestamp: Number(timestamp),
          ...values.reduce((memo, item) => {
            let source =
              knownSwapSources[chainName][item.source] || item.source;
            if (!topVolumeSources.has(source)) {
              source = "Other";
            }
            if (item.swap != 0) {
              const volume = item.swap / 1e30;
              memo[source] = memo[source] || 0;
              memo[source] += volume;
              all += volume;
            }
            return memo;
          }, {}),
        };

        retItem.all = all;

        return retItem;
      })
      .sortBy((item) => item.timestamp)
      .value();

    return ret;
  }, [graphData]);

  return [data, loading, error];
}

export const useTotalVolumeFromServer = () => {
  const query = `
  query MyQuery {
    volumeStats(orderBy: id, orderDirection: desc, first: 1) {
      cumulative
    }
  }
  
    `;
  const { data, error } = useSWR(query, gqlFetcher);

  return {
    data: data,
    loading: !error && !data,
    error: error,
  };
};

export function useVolumeDataRequest(from, to) {
  const query = `
  {
    volumeStats(where: {period: daily}) {
      burn
      id
      liquidation
      margin
      mint
      period
      swap
      cumulative
    }
  }
  `;
  const { data, error } = useSWR(query, gqlFetcher);
  let loading = !error && !data;
  let resp;
  if (data) {
    console.log("volumeStats: " + JSON.stringify(data));
    resp = data.volumeStats.map((volume) => {
      let burnAmount = volume.burn / 1e30;
      let liquidationAmount = volume.liquidation / 1e30;
      let marginAmount = volume.margin / 1e30;
      let mintAmount = volume.mint / 1e30;
      let swapAmount = volume.swap / 1e30;
      let cumulationAmount = volume.cumulative / 1e30;

      let tally =
        burnAmount + liquidationAmount + marginAmount + swapAmount + mintAmount;
      return {
        burn: burnAmount,
        liquidation: liquidationAmount,
        timestamp: volume.id,
        margin: marginAmount,
        mint: mintAmount,
        swap: swapAmount,
        cumulative: cumulationAmount,
        all: tally,
      };
    });
  }
  return [resp, loading, error];
}

export function useVolumeDataFromServer({
  from = FIRST_DATE_TS,
  to = NOW_TS,
} = {}) {
  const PROPS = "margin liquidation swap mint burn".split(" ");
  const [data, loading] = useVolumeDataRequest(null, from, to);
  console.log("useVolumeDataRequest", data);

  // const ret = useMemo(() => {
  //   if (!data) {
  //     return null;
  //   }

  //   const tmp = data.reduce((memo, item) => {
  //     const timestamp = item.data.timestamp;
  //     if (timestamp < from || timestamp > to) {
  //       return memo;
  //     }

  //     let type;
  //     if (item.data.action === "Swap") {
  //       type = "swap";
  //     } else if (item.data.action === "SellUSDG") {
  //       type = "burn";
  //     } else if (item.data.action === "BuyUSDG") {
  //       type = "mint";
  //     } else if (item.data.action.includes("LiquidatePosition")) {
  //       type = "liquidation";
  //     } else {
  //       type = "margin";
  //     }
  //     const volume = Number(item.data.volume) / 1e30;
  //     memo[timestamp] = memo[timestamp] || {};
  //     memo[timestamp][type] = memo[timestamp][type] || 0;
  //     memo[timestamp][type] += volume;
  //     return memo;
  //   }, {});

  //   let cumulative = 0;
  //   const cumulativeByTs = {};
  //   return Object.keys(tmp)
  //     .sort()
  //     .map((timestamp) => {
  //       const item = tmp[timestamp];
  //       let all = 0;

  //       let movingAverageAll;
  //       const movingAverageTs = timestamp - MOVING_AVERAGE_PERIOD;
  //       if (movingAverageTs in cumulativeByTs) {
  //         movingAverageAll =
  //           (cumulative - cumulativeByTs[movingAverageTs]) /
  //           MOVING_AVERAGE_DAYS;
  //       }

  //       PROPS.forEach((prop) => {
  //         if (item[prop]) all += item[prop];
  //       });
  //       cumulative += all;
  //       cumulativeByTs[timestamp] = cumulative;
  //       return {
  //         timestamp,
  //         all,
  //         cumulative,
  //         movingAverageAll,
  //         ...item,
  //       };
  //     });
  // }, [data, from, to]);

  return [[[], []], loading];
}

export function useEsbtUserData({ from = FIRST_DATE_TS, to = NOW_TS } = {}) {
  const query = `query MyQuery {
    esbtUsers {
      id
      tally
    }
  }
  `;
  const [graphData, loading, error] = useGraph(query);

  let cumulativeNewUserCount = 0;
  const data = graphData
    ? sortBy(graphData.esbtUsers, "id").map((item) => {
        console.log("esbt users item:", item);
        const oldCount = cumulativeNewUserCount;
        cumulativeNewUserCount += item.tally;
        const oldPercent = ((oldCount / cumulativeNewUserCount) * 100).toFixed(
          2
        );
        return {
          oldCount,
          oldPercent,
          timestamp: item.id,
          cumulativeNewUserCount,
          ...item,
        };
      })
    : null;

  return [data, loading, error];
}

export function useUsersData({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  chainName = "bsc",
} = {}) {
  const query = `{
    userStats(
      first: 1000
      orderBy: timestamp
      orderDirection: desc
      where: { period: "daily", timestamp_gte: ${from}, timestamp_lte: ${to} }
      subgraphError: allow
    ) {
      uniqueCount
      uniqueSwapCount
      uniqueMarginCount
      uniqueMintBurnCount
      uniqueCountCumulative
      uniqueSwapCountCumulative
      uniqueMarginCountCumulative
      uniqueMintBurnCountCumulative
      actionCount
      actionSwapCount
      actionMarginCount
      actionMintBurnCount
      timestamp
    }
  }`;
  const [graphData, loading, error] = useGraph(query, { chainName });

  const prevUniqueCountCumulative = {};
  let cumulativeNewUserCount = 0;
  const data = graphData
    ? sortBy(graphData.userStats, "timestamp").map((item) => {
        const newCountData = ["", "Swap", "Margin", "MintBurn"].reduce(
          (memo, type) => {
            memo[`new${type}Count`] = prevUniqueCountCumulative[type]
              ? item[`unique${type}CountCumulative`] -
                prevUniqueCountCumulative[type]
              : item[`unique${type}Count`];
            prevUniqueCountCumulative[type] =
              item[`unique${type}CountCumulative`];
            return memo;
          },
          {}
        );
        cumulativeNewUserCount += newCountData.newCount;
        const oldCount = item.uniqueCount - newCountData.newCount;
        const oldPercent = ((oldCount / item.uniqueCount) * 100).toFixed(1);
        return {
          all: item.uniqueCount,
          uniqueSum:
            item.uniqueSwapCount +
            item.uniqueMarginCount +
            item.uniqueMintBurnCount,
          oldCount,
          oldPercent,
          cumulativeNewUserCount,
          ...newCountData,
          ...item,
        };
      })
    : null;

  return [data, loading, error];
}

export function useFundingRateData({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  chainName = "bsc",
} = {}) {
  const query = `{
    fundingRates(
      first: 1000,
      orderBy: timestamp,
      orderDirection: desc,
      where: { period: "daily", id_gte: ${from}, id_lte: ${to} }
      subgraphError: allow
    ) {
      id,
      token,
      timestamp,
      startFundingRate,
      startTimestamp,
      endFundingRate,
      endTimestamp
    }
  }`;
  const [graphData, loading, error] = useGraph(query, { chainName });
  console.log("fundingRates query", query);

  const data = useMemo(() => {
    if (!graphData) {
      return null;
    }

    const groups = graphData.fundingRates.reduce((memo, item) => {
      const symbol = tokenSymbols[item.token];
      if (symbol === "MIM") {
        return memo;
      }
      memo[item.timestamp] = memo[item.timestamp] || {
        timestamp: item.timestamp,
      };
      const group = memo[item.timestamp];
      const timeDelta =
        parseInt((item.endTimestamp - item.startTimestamp) / 3600) * 3600;

      let fundingRate = 0;
      if (item.endFundingRate && item.startFundingRate) {
        const fundingDelta = item.endFundingRate - item.startFundingRate;
        const divisor = timeDelta / 86400;
        fundingRate = (fundingDelta / divisor / 10000) * 365;
      }
      group[symbol] = fundingRate;
      return memo;
    }, {});

    return fillNa(sortBy(Object.values(groups), "timestamp"));
  }, [graphData]);

  return [data, loading, error];
}

const MOVING_AVERAGE_DAYS = 7;
const MOVING_AVERAGE_PERIOD = 86400 * MOVING_AVERAGE_DAYS;

export function useVolumeData({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  chainName = "bsc",
} = {}) {
  const PROPS = "margin liquidation swap mint burn".split(" ");
  const timestampProp = "id";
  const query = `{
    volumeStats(
      first: 1000,
      orderBy: ${timestampProp},
      orderDirection: desc
      where: { period: daily, ${timestampProp}_gte: ${from}, ${timestampProp}_lte: ${to} }
      subgraphError: allow
    ) {
      ${timestampProp}
      ${PROPS.join("\n")}
    }
  }`;
  const [graphData, loading, error] = useGraph(query, { chainName });

  const data = useMemo(() => {
    if (!graphData) {
      return null;
    }

    let ret = sortBy(graphData.volumeStats, timestampProp).map((item) => {
      const ret = { timestamp: item[timestampProp] };
      let all = 0;
      PROPS.forEach((prop) => {
        ret[prop] = item[prop] / 1e30;
        all += ret[prop];
      });
      ret.all = all;
      return ret;
    });

    let cumulative = 0;
    const cumulativeByTs = {};
    return ret.map((item) => {
      cumulative += item.all;

      let movingAverageAll;
      const movingAverageTs = item.timestamp - MOVING_AVERAGE_PERIOD;
      if (movingAverageTs in cumulativeByTs) {
        movingAverageAll =
          (cumulative - cumulativeByTs[movingAverageTs]) / MOVING_AVERAGE_DAYS;
      }

      return {
        movingAverageAll,
        cumulative,
        ...item,
      };
    });
  }, [graphData]);

  return [data, loading, error];
}

export function useFeesData({ from = FIRST_DATE_TS, to = NOW_TS } = {}) {
  const PROPS = "margin liquidation swap mint burn".split(" ");
  const feesQuery = `{
    feeStats(
      first: 1000
      orderBy: id
      orderDirection: desc
      where: { period: daily, id_gte: ${from}, id_lte: ${to} }
      subgraphError: allow
    ) {
      id
      margin
      marginAndLiquidation
      swap
      mint
      burn
    }
  }`;
  let [feesData, loading, error] = useGraph(feesQuery);
  console.log("feesData", feesData);

  const feesChartData = useMemo(() => {
    if (!feesData) {
      return null;
    }

    let chartData = sortBy(feesData.feeStats, "id").map((item) => {
      const ret = { timestamp: item.id };

      PROPS.forEach((prop) => {
        if (item[prop]) {
          ret[prop] = item[prop] / 1e30;
        }
      });

      ret.liquidation = item.marginAndLiquidation / 1e30 - item.margin / 1e30;
      ret.all = PROPS.reduce((memo, prop) => memo + ret[prop], 0);
      return ret;
    });

    let cumulative = 0;
    const cumulativeByTs = {};
    return chain(chartData)
      .groupBy((item) => item.timestamp)
      .map((values, timestamp) => {
        const all = sumBy(values, "all");
        cumulative += all;

        let movingAverageAll;
        const movingAverageTs = timestamp - MOVING_AVERAGE_PERIOD;
        if (movingAverageTs in cumulativeByTs) {
          movingAverageAll =
            (cumulative - cumulativeByTs[movingAverageTs]) /
            MOVING_AVERAGE_DAYS;
        }

        const ret = {
          timestamp: Number(timestamp),
          all,
          cumulative,
          movingAverageAll,
        };
        PROPS.forEach((prop) => {
          ret[prop] = sumBy(values, prop);
        });
        cumulativeByTs[timestamp] = cumulative;
        return ret;
      })
      .value()
      .filter((item) => item.timestamp >= from);
  }, [feesData]);

  console.log("feesData:", feesChartData);
  return [feesChartData, loading, error];
}

export function useAumPerformanceData({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  groupPeriod = 86400,
} = {}) {
  const [feesData, feesLoading] = useFeesData({ from, to, groupPeriod });
  const [glpData, glpLoading] = useGlpData({ from, to, groupPeriod });

  const [volumeData, volumeLoading] = useVolumeData({ from, to, groupPeriod });

  const dailyCoef = 86400 / groupPeriod;

  const data = useMemo(() => {
    if (!feesData || !glpData || !volumeData) {
      return null;
    }

    const ret = feesData.map((feeItem, i) => {
      const glpItem = glpData[i];
      const volumeItem = volumeData[i];
      let apr =
        feeItem?.all && glpItem?.aum
          ? (feeItem.all / glpItem.aum) * 100 * 365 * dailyCoef
          : null;
      if (apr > 10000) {
        apr = null;
      }
      let usage =
        volumeItem?.all && glpItem?.aum
          ? (volumeItem.all / glpItem.aum) * 100 * dailyCoef
          : null;
      if (usage > 10000) {
        usage = null;
      }

      return {
        timestamp: feeItem.timestamp,
        apr,
        usage,
      };
    });
    const averageApr =
      ret.reduce((memo, item) => item.apr + memo, 0) / ret.length;
    ret.forEach((item) => (item.averageApr = averageApr));
    const averageUsage =
      ret.reduce((memo, item) => item.usage + memo, 0) / ret.length;
    ret.forEach((item) => (item.averageUsage = averageUsage));
    return ret;
  }, [feesData, glpData, volumeData]);

  return [data, feesLoading || glpLoading || volumeLoading];
}

export function useGlpData({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  chainName = "bsc",
} = {}) {
  const timestampProp = "id";
  const query = `{
    glpStats(
      first: 1000
      orderBy: ${timestampProp}
      orderDirection: desc
      where: {
        period: daily
        ${timestampProp}_gte: ${from}
        ${timestampProp}_lte: ${to}
      }
      subgraphError: allow
    ) {
      ${timestampProp}
      aumInUsdg
      glpSupply
      distributedUsd
      distributedEth
    }
  }`;
  let [data, loading, error] = useGraph(query, { chainName });

  let cumulativeDistributedUsdPerGlp = 0;
  let cumulativeDistributedEthPerGlp = 0;
  const glpChartData = useMemo(() => {
    if (!data) {
      return null;
    }

    let prevGlpSupply;
    let prevAum;

    let ret = sortBy(data.glpStats, (item) => item[timestampProp])
      .filter((item) => item[timestampProp] % 86400 === 0)
      .reduce((memo, item) => {
        const last = memo[memo.length - 1];

        const aum = Number(item.aumInUsdg) / 1e18;
        const glpSupply = Number(item.glpSupply) / 1e18;

        const distributedUsd = Number(item.distributedUsd) / 1e30;
        const distributedUsdPerGlp = distributedUsd / glpSupply || 0;
        cumulativeDistributedUsdPerGlp += distributedUsdPerGlp;

        const distributedEth = Number(item.distributedEth) / 1e18;
        const distributedEthPerGlp = distributedEth / glpSupply || 0;
        cumulativeDistributedEthPerGlp += distributedEthPerGlp;

        const glpPrice = aum / glpSupply;
        const timestamp = parseInt(item[timestampProp]);

        const newItem = {
          timestamp,
          aum,
          glpSupply,
          glpPrice,
          cumulativeDistributedEthPerGlp,
          cumulativeDistributedUsdPerGlp,
          distributedUsdPerGlp,
          distributedEthPerGlp,
        };

        if (last && last.timestamp === timestamp) {
          memo[memo.length - 1] = newItem;
        } else {
          memo.push(newItem);
        }

        return memo;
      }, [])
      .map((item) => {
        let { glpSupply, aum } = item;
        if (!glpSupply) {
          glpSupply = prevGlpSupply;
        }
        if (!aum) {
          aum = prevAum;
        }
        item.glpSupplyChange = prevGlpSupply
          ? ((glpSupply - prevGlpSupply) / prevGlpSupply) * 100
          : 0;
        if (item.glpSupplyChange > 1000) {
          item.glpSupplyChange = 0;
        }
        item.aumChange = prevAum ? ((aum - prevAum) / prevAum) * 100 : 0;
        if (item.aumChange > 1000) {
          item.aumChange = 0;
        }
        prevGlpSupply = glpSupply;
        prevAum = aum;
        return item;
      });

    ret = fillNa(ret);
    return ret;
  }, [data]);

  return [glpChartData, loading, error];
}

export function useGlpPerformanceData(
  glpData,
  feesData,
  { from = FIRST_DATE_TS, chainName = "bsc" } = {}
) {
  const [btcPrices] = useCoingeckoPrices("BTC", { from });
  const [ethPrices] = useCoingeckoPrices("ETH", { from });

  const glpPerformanceChartData = useMemo(() => {
    if (!btcPrices || !ethPrices || !glpData || !feesData) {
      return null;
    }

    const glpDataById = glpData.reduce((memo, item) => {
      memo[item.timestamp] = item;
      return memo;
    }, {});

    const feesDataById = feesData.reduce((memo, item) => {
      memo[item.timestamp] = item;
      return memo;
    });

    let BTC_WEIGHT = 0;
    let ETH_WEIGHT = 0;
    let AVAX_WEIGHT = 0;

    if (chainName === "avalanche") {
      BTC_WEIGHT = 0.166;
      ETH_WEIGHT = 0.166;
      AVAX_WEIGHT = 0.166;
    } else {
      BTC_WEIGHT = 0.25;
      ETH_WEIGHT = 0.25;
    }

    const STABLE_WEIGHT = 1 - BTC_WEIGHT - ETH_WEIGHT - AVAX_WEIGHT;
    const GLP_START_PRICE =
      glpDataById[btcPrices[0].timestamp]?.glpPrice || 1.19;

    const btcFirstPrice = btcPrices[0]?.value;
    const ethFirstPrice = ethPrices[0]?.value;

    let indexBtcCount = (GLP_START_PRICE * BTC_WEIGHT) / btcFirstPrice;
    let indexEthCount = (GLP_START_PRICE * ETH_WEIGHT) / ethFirstPrice;
    let indexStableCount = GLP_START_PRICE * STABLE_WEIGHT;

    const lpBtcCount = (GLP_START_PRICE * 0.5) / btcFirstPrice;
    const lpEthCount = (GLP_START_PRICE * 0.5) / ethFirstPrice;

    const ret = [];
    let cumulativeFeesPerGlp = 0;
    let lastGlpItem;
    let lastFeesItem;

    let prevEthPrice = 3400;
    for (let i = 0; i < btcPrices.length; i++) {
      const btcPrice = btcPrices[i].value;
      const ethPrice = ethPrices[i]?.value || prevEthPrice;
      prevEthPrice = ethPrice;

      const timestampGroup = parseInt(btcPrices[i].timestamp / 86400) * 86400;
      const glpItem = glpDataById[timestampGroup] || lastGlpItem;
      lastGlpItem = glpItem;

      const glpPrice = glpItem?.glpPrice;
      const glpSupply = glpItem?.glpSupply;

      const feesItem = feesDataById[timestampGroup] || lastFeesItem;
      lastFeesItem = feesItem;

      const dailyFees = feesItem?.all;

      const syntheticPrice =
        indexBtcCount * btcPrice + indexEthCount * ethPrice + indexStableCount;

      // rebalance each day. can rebalance each X days
      if (i % 1 === 0) {
        indexBtcCount = (syntheticPrice * BTC_WEIGHT) / btcPrice;
        indexEthCount = (syntheticPrice * ETH_WEIGHT) / ethPrice;
        indexStableCount = syntheticPrice * STABLE_WEIGHT;
      }

      const lpBtcPrice =
        (lpBtcCount * btcPrice + GLP_START_PRICE / 2) *
        (1 + getImpermanentLoss(btcPrice / btcFirstPrice));
      const lpEthPrice =
        (lpEthCount * ethPrice + GLP_START_PRICE / 2) *
        (1 + getImpermanentLoss(ethPrice / ethFirstPrice));

      if (dailyFees && glpSupply) {
        const INCREASED_GLP_REWARDS_TIMESTAMP = 1635714000;
        const GLP_REWARDS_SHARE =
          timestampGroup >= INCREASED_GLP_REWARDS_TIMESTAMP ? 0.7 : 0.5;
        const collectedFeesPerGlp = (dailyFees / glpSupply) * GLP_REWARDS_SHARE;
        cumulativeFeesPerGlp += collectedFeesPerGlp;
      }

      let glpPlusFees = glpPrice;
      if (glpPrice && glpSupply && cumulativeFeesPerGlp) {
        glpPlusFees = glpPrice + cumulativeFeesPerGlp;
      }

      let glpApr;
      let glpPlusDistributedUsd;
      let glpPlusDistributedEth;
      if (glpItem) {
        if (glpItem.cumulativeDistributedUsdPerGlp) {
          glpPlusDistributedUsd =
            glpPrice + glpItem.cumulativeDistributedUsdPerGlp;
          // glpApr = glpItem.distributedUsdPerGlp / glpPrice * 365 * 100 // incorrect?
        }
        if (glpItem.cumulativeDistributedEthPerGlp) {
          glpPlusDistributedEth =
            glpPrice + glpItem.cumulativeDistributedEthPerGlp * ethPrice;
        }
      }

      ret.push({
        timestamp: btcPrices[i].timestamp,
        syntheticPrice,
        lpBtcPrice,
        lpEthPrice,
        glpPrice,
        btcPrice,
        ethPrice,
        glpPlusFees,
        glpPlusDistributedUsd,
        glpPlusDistributedEth,

        indexBtcCount,
        indexEthCount,
        indexStableCount,

        BTC_WEIGHT,
        ETH_WEIGHT,
        AVAX_WEIGHT,
        STABLE_WEIGHT,

        performanceLpEth: ((glpPrice / lpEthPrice) * 100).toFixed(2),
        performanceLpEthCollectedFees: (
          (glpPlusFees / lpEthPrice) *
          100
        ).toFixed(2),
        performanceLpEthDistributedUsd: (
          (glpPlusDistributedUsd / lpEthPrice) *
          100
        ).toFixed(2),
        performanceLpEthDistributedEth: (
          (glpPlusDistributedEth / lpEthPrice) *
          100
        ).toFixed(2),

        performanceLpBtcCollectedFees: (
          (glpPlusFees / lpBtcPrice) *
          100
        ).toFixed(2),

        performanceSynthetic: ((glpPrice / syntheticPrice) * 100).toFixed(2),
        performanceSyntheticCollectedFees: (
          (glpPlusFees / syntheticPrice) *
          100
        ).toFixed(2),
        performanceSyntheticDistributedUsd: (
          (glpPlusDistributedUsd / syntheticPrice) *
          100
        ).toFixed(2),
        performanceSyntheticDistributedEth: (
          (glpPlusDistributedEth / syntheticPrice) *
          100
        ).toFixed(2),

        glpApr,
      });
    }

    return ret;
  }, [btcPrices, ethPrices, glpData, feesData]);

  return [glpPerformanceChartData];
}

export function useTokenStats({
  from = FIRST_DATE_TS,
  to = NOW_TS,
  period = "daily",
  chainName = "bsc",
} = {}) {
  const getTokenStatsFragment = ({ skip = 0 } = {}) => `
    tokenStats(
      first: 1000,
      skip: ${skip},
      orderBy: timestamp,
      orderDirection: desc,
      where: { period: ${period}, timestamp_gte: ${from}, timestamp_lte: ${to} }
      subgraphError: allow
    ) {
      poolAmountUsd
      timestamp
      token
    }
  `;

  // Request more than 1000 records to retrieve maximum stats for period
  const query = `{
    a: ${getTokenStatsFragment()}
    b: ${getTokenStatsFragment({ skip: 1000 })},
    c: ${getTokenStatsFragment({ skip: 2000 })},
    d: ${getTokenStatsFragment({ skip: 3000 })},
    e: ${getTokenStatsFragment({ skip: 4000 })},
    f: ${getTokenStatsFragment({ skip: 5000 })},
  }`;

  const [graphData, loading, error] = useGraph(query, { chainName });

  const data = useMemo(() => {
    if (loading || !graphData) {
      return null;
    }

    const fullData = Object.values(graphData).reduce((memo, records) => {
      memo.push(...records);
      return memo;
    }, []);

    const retrievedTokens = new Set();

    const timestampGroups = fullData.reduce((memo, item) => {
      const { timestamp, token, ...stats } = item;

      const symbol = tokenSymbols[token] || token;

      retrievedTokens.add(symbol);

      memo[timestamp] = memo[timestamp || 0] || {};

      memo[timestamp][symbol] = {
        poolAmountUsd: parseInt(stats.poolAmountUsd) / 1e30,
      };

      return memo;
    }, {});

    const poolAmountUsdRecords = [];

    Object.entries(timestampGroups).forEach(([timestamp, dataItem]) => {
      const poolAmountUsdRecord = Object.entries(dataItem).reduce(
        (memo, [token, stats]) => {
          memo.all += stats.poolAmountUsd;
          memo[token] = stats.poolAmountUsd;
          memo.timestamp = timestamp;

          return memo;
        },
        { all: 0 }
      );

      poolAmountUsdRecords.push(poolAmountUsdRecord);
    });

    return {
      poolAmountUsd: poolAmountUsdRecords,
      tokenSymbols: Array.from(retrievedTokens),
    };
  }, [graphData, loading]);

  return [data, loading, error];
}
