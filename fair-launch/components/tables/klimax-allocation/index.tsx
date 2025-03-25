"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useMemo } from "react";
import { css } from "styled-system/css";
import * as styles from "../styles";

interface Props<T> {
  data: T[];
}

export interface Data {
  marketCap: string | number;
  projectedValue: string | number;
}

export const KlimaXAllocationTable = <T extends Data>({
  data,
}: Props<T>) => {
  const columns: ColumnDef<T>[] = useMemo(
    () => [
      {
        id: "marketCap",
        header: "Market Cap",
        accessorKey: "marketCap",
        cell: () => '-',
      },
      {
        id: "projectedValue",
        header: "Projected USD Value",
        accessorKey: "projectedValue",
        cell: () => '-',
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
                      <td
                        className={clsx(
                          styles.tableCell,
                          styles.stakeTableCell
                        )}
                        key={cell.id}
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
