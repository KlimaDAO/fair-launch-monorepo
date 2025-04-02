"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatCurrency, formatLargeNumber } from "@utils/formatting";
import clsx from "clsx";
import { useMemo } from "react";
import { css } from "styled-system/css";
import * as styles from "../styles";

interface Props {
  userPoints: bigint;
  totalPoints: bigint;
}

export interface Data {
  marketCap: string | number;
  projectedValue: string | number;
}

const marketCapList = [225_000_000, 625_000_000, 1_500_000_000, 3_750_000_000];

export const KlimaXAllocationTable = <T extends Data>(props: Props) => {
  const columns: ColumnDef<T>[] = useMemo(
    () => [
      {
        id: "marketCap",
        header: "Market Cap",
        accessorKey: "marketCap",
        cell: ({ getValue }) => formatLargeNumber(Number(getValue())),
      },
      {
        id: "projectedValue",
        header: "Projected USD Value",
        accessorKey: "projectedValue",
        cell: ({ getValue }) => formatCurrency(Number(getValue()), 0),
      },
    ],
    [props.userPoints, props.totalPoints]
  );

  const table = useReactTable({
    columns,
    getCoreRowModel: getCoreRowModel(),
    data: marketCapList.map((marketCap) => {
      const fortyPercentMarketCap =
        (BigInt(marketCap) * BigInt(40)) / BigInt(100);
      const userShareValue =
        (fortyPercentMarketCap * BigInt(props.userPoints)) /
        BigInt(props.totalPoints);
      return {
        marketCap,
        projectedValue: Number(userShareValue),
      };
    }) as T[],
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
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td className={styles.tableCell} key={cell.id}>
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
                  <i>No data to show yet</i>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
