"use client";

import { UnstakeDialog } from "@components/dialogs/unstake-dialog";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatLargeNumber, formatNumber, formatTimestamp } from "@utils/formatting";
import clsx from "clsx";
import { useMemo } from "react";
import { css } from "styled-system/css";
import { formatUnits } from "viem";
import * as styles from "../styles";

interface Props<T> {
  data: T[];
  totalStaked: number;
}

export interface StakeData {
  amount: string;
  multiplier: string;
  burnValue: string;
  points: bigint | number | string;
  burnPercentage: string;
  startTimestamp: string;
  klimaxAllocation: bigint | number | string;
}

export const StakesTable = <T extends StakeData>({
  data,
  totalStaked,
}: Props<T>) => {
  const columns: ColumnDef<T>[] = useMemo(
    () => [
      {
        id: "startTimestamp",
        header: "Timestamp",
        accessorKey: "startTimestamp",
        cell: ({ getValue }) => {
          const value = getValue();
          return <>{formatTimestamp(parseInt(value as string))}</>;
        },
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "KLIMA(v0) Staked",
        cell: ({ getValue }) => {
          const value = getValue();
          return <>{formatNumber(formatUnits(BigInt(value as string), 9))}</>;
        },
      },
      {
        id: "points",
        header: "Points",
        cell: ({ row }) => {
          const points = row.original.points;
          return <>{formatLargeNumber(Number(formatUnits(BigInt(points as string), 9)))}</>;
        },
      },
      {
        id: "unstakePenalty",
        header: "Unstake Penalty",
        cell: ({ row }) => {
          return (
            <div
              className={css({
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: "0.4rem",
                lg: {
                  flexDirection: "column",
                },
              })}
            >
              <div>-{row.original.burnValue} KLIMA</div>
              <div className={styles.penaltyText}>
                {row.original.burnPercentage}
              </div>
            </div>
          );
        },
      },
      {
        id: "klimaxAllocation",
        header: "KlimaX Allocation",
        cell: ({ row }) => {
          const klimaxAllocation = row.original.klimaxAllocation;
          console.log('klimaxAllocation', klimaxAllocation);
          return <><strong>{formatLargeNumber(Number(formatUnits(BigInt(klimaxAllocation as string), 9)))}</strong> KlimaX</>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <UnstakeDialog
            amount={row.original.amount}
            startTimestamp={row.original.startTimestamp}
            totalStaked={totalStaked}
          />
        ),
      },
    ],
    [data, totalStaked]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className={css({ hideFrom: "md", width: "100%" })}>
        {table.getRowModel().rows.length ? (
          <>
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0rem",
                  padding: "1.2rem 0",
                  borderBottom: "1px solid #999999",
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <div
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "1.2rem",
                    })}
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header, index) => (
                      <div
                        key={header.id}
                        className={css({
                          flex: "0 0 calc(50% - 1.2rem)",
                          textAlign: index % 2 === 0 ? "left" : "right",
                        })}
                      >
                        <div
                          className={css({
                            fontWeight: 400,
                            fontSize: "1.2rem",
                            lineHeight: "1.6rem",
                            color: "#777",
                            flex: "50%",
                          })}
                          key={header.id}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                        <div
                          className={css({
                            fontWeight: 400,
                            fontSize: "1.4rem",
                            lineHeight: "2rem",
                            color: "#1E1e1e",
                          })}
                        >
                          {flexRender(
                            row.getAllCells()[index].column.columnDef.cell,
                            row.getAllCells()[index].getContext()
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </>
        ) : (
          <div className={styles.tableCell}>
            <i>None yet</i>
          </div>
        )}
      </div>
      <div
        className={clsx(
          styles.tableContainer,
          css({ hideBelow: "md", width: "100%" })
        )}
      >
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    id={header.id === "klimaxAllocation" ? "step4" : ""}
                    className={styles.tableHead}
                    key={header.id}
                    colSpan={header.colSpan}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className={styles.tableBody}>
            {table.getRowModel().rows.length ? (
              <>
                {table.getRowModel().rows.map((row, rowIndex) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <td
                        className={clsx(
                          styles.tableCell,
                          styles.stakeTableCell
                        )}
                        key={cell.id}
                        id={rowIndex === 0 && cellIndex === 0 ? "step3" : ""}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td className={styles.tableCell} colSpan={6}>
                  <i>None yet</i>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
