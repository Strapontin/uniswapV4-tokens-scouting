"use client";

import {
  createChart,
  ColorType,
  LineSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import type { TwapPricePoint } from "@/lib/twap";
import { useTwapPairOrder } from "@/components/TwapPairOrder";

export function TwapChart({
  data,
  error,
}: {
  data: TwapPricePoint[];
  error: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { isReversed } = useTwapPairOrder();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0d1412" },
        textColor: "#8d9b93",
      },
      grid: {
        vertLines: { color: "#1d2923" },
        horzLines: { color: "#1d2923" },
      },
      rightPriceScale: { borderColor: "#2a3831" },
      timeScale: {
        borderColor: "#2a3831",
        timeVisible: true,
        secondsVisible: false,
      },
    });
    chartRef.current = chart;
    const series = chart.addSeries(LineSeries, {
      color: "#f0784b",
      priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
      priceLineVisible: false,
      lastValueVisible: true,
    });
    series.setData(
      data.map((point) => ({
        time: point.time as UTCTimestamp,
        value: isReversed ? point.token1Value : point.token0Value,
      })),
    );
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, isReversed]);

  return (
    <section
      className="mt-4 rounded-xl border border-[#2a3831] bg-[#0d1412] p-3"
      aria-label="TWAP chart"
    >
      <h2 className="mb-3 font-mono text-[14px] uppercase tracking-[.08em] text-[#8d9b93]">
        TWAP chart
      </h2>
      {error ? (
        <p className="px-2 py-16 text-center font-mono text-[12px] text-[#8d9b93]">
          {error}
        </p>
      ) : data.length === 0 ? (
        <p className="px-2 py-16 text-center font-mono text-[12px] text-[#8d9b93]">
          No hourly price data found for the last 7 days.
        </p>
      ) : (
        <div ref={containerRef} className="h-[360px] w-full" />
      )}
    </section>
  );
}
