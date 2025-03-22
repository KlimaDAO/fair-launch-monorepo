"use client";

import { UnstakeDialog } from "@components/dialogs/unstake-dialog";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatNumber, formatTimestamp } from "@utils/formatting";
import { useMemo } from "react";
import { formatUnits } from "viem";
import * as styles from "../styles";
import { totalUserStakes } from "@utils/contract";

interface Props<T> {
  data: T[];
  totalStaked: number;
}

export interface StakeData {
  amount: string;
  multiplier: string;
  burnValue: string;
  points: bigint | string;
  burnPercentage: string;
  startTimestamp: string;
}

export const StakesTable = <T extends StakeData>({ data, totalStaked }: Props<T>) => {
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
          return <>{formatUnits(BigInt(points as string), 9)}</>;
        },
      },
      {
        id: "unstakePenalty",
        header: "Unstake Penalty",
        cell: ({ row }) => {
          return (
            <>
              <div>-{row.original.burnValue} KLIMA</div>
              <div className={styles.penaltyText}>
                {row.original.burnPercentage}
              </div>
            </>
          );
        },
      },
      {
        id: "klimaxAllocation",
        header: "KLIMAX Allocation",
        cell: () => "-",
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
