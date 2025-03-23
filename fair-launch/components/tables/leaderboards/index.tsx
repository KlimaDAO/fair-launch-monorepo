"use client";

import { Badge } from "@components/badge";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  formatLargeNumber,
  formatNumber,
  truncateAddress,
} from "@utils/formatting";
import clsx from "clsx";
import { useMemo } from "react";
import { css } from "styled-system/css";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import * as styles from "../styles";

interface Props<T> {
  data: T[];
}

export interface LeaderboardData {
  id: string;
  totalStaked: bigint | string;
  totalPoints: bigint | string;
}

const isUserWallet = (walletAddress: string, address: string) => {
  return walletAddress.toLowerCase() === address?.toLowerCase();
};

export const LeaderboardsTable = <T extends LeaderboardData>({
  data,
}: Props<T>) => {
  const { address } = useAccount();
  const columns: ColumnDef<T>[] = useMemo(
    () => [
      {
        id: "place",
        header: "Place",
        accessorKey: "place",
        cell: ({ row }) => {
          const userWallet = isUserWallet(row.original.id, address as string);
          return (
            <div
              className={clsx({
                [styles.userWalletText]: userWallet,
              })}
            >
              {row.index + 1}
            </div>
          );
        },
      },
      {
        id: "walletAddress",
        accessorKey: "id",
        header: "Wallet",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const userWallet = isUserWallet(value, address as string);
          return (
            <div
              className={clsx({
                [styles.userWalletText]: userWallet,
              })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
              }}
            >
              {truncateAddress(value)}
              {userWallet && (
                <Badge
                  className={css({ hideBelow: "md" })}
                  variant="table"
                  title="You"
                />
              )}
            </div>
          );
        },
      },
      {
        id: "totalStaked",
        accessorKey: "totalStaked",
        header: "KLIMA(v0) Staked",
        cell: ({ row, getValue }) => {
          const value = getValue();
          const userWallet = isUserWallet(row.original.id, address as string);
          return (
            <div
              className={clsx({
                [styles.userWalletText]: userWallet,
              })}
            >
              {formatNumber(formatUnits(BigInt(value as string), 9))}
            </div>
          );
        },
      },
      {
        id: "totalPoints",
        header: "Points",
        accessorKey: "totalPoints",
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          const userWallet = isUserWallet(row.original.id, address as string);
          return (
            <div
              className={clsx({
                [styles.userWalletText]: userWallet,
              })}
            >
              {formatLargeNumber(
                Number(formatUnits(BigInt(value as string), 9))
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className={css({ hideFrom: "md", width: "100%" })}>
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
            <div
              style={{
                textAlign: "center",
                width: "3.3rem",
                marginBottom: "1.2rem",
                color: "#1E1e1e",
                fontWeight: "700",
                fontSize: "1.8rem",
              }}
            >
              {flexRender(
                row.getAllCells()[0].column.columnDef.cell,
                row.getAllCells()[0].getContext()
              )}
            </div>
            {table.getHeaderGroups().map((headerGroup) => (
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0rem",
                })}
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => {
                  if (header.id === "place") return null;
                  return (
                    <div
                      className={css({
                        fontWeight: 400,
                        fontSize: "1.2rem",
                        lineHeight: "1.6rem",
                        color: "#777",
                      })}
                      key={header.id}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.8rem",
              }}
            >
              {row.getVisibleCells().map((cell) => {
                if (cell.column.id === "place") return null;
                return (
                  <div
                    className={css({
                      fontWeight: 400,
                      fontSize: "1.4rem",
                      lineHeight: "2rem",
                      color: "#1E1e1e",
                    })}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
                    key={header.id}
                    aria-label="leaderboard-table-head"
                    className={styles.tableHead}
                    colSpan={header.colSpan}
                  >
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
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
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td
                          key={cell.id}
                          aria-label="leaderboard-table-cell"
                          className={styles.tableCell}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td className={styles.tableCell} colSpan={4}>
                  <i>No data to display yet</i>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
