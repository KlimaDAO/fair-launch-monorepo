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
              {userWallet && <Badge variant="table" title="You" />}
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
    <div className={styles.tableContainer}>
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
                  <div
                    {...{
                      className: header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : "",
                    }}
                  >
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
                      <td className={styles.tableCell} key={cell.id}>
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
              <td className={styles.tableCell} colSpan={6}>
                None yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
