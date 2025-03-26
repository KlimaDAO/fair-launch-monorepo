"use client";

import { Badge } from "@components/badge";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  formatLargeNumber,
  formatNumber,
  truncateAddress,
} from "@utils/formatting";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { css } from "styled-system/css";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import * as styles from "../styles";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { Dropdown } from "@components/dropdown";

interface Props<T> {
  data: T[];
  showPagination?: boolean;
}

export interface LeaderboardData {
  id: string;
  totalStaked: bigint | string;
  totalPoints: bigint | string;
}

const isUserWallet = (walletAddress: string, address: string) => {
  return walletAddress.toLowerCase() === address?.toLowerCase();
};

const dropdownItems = [
  { value: "asc", label: "Points - high to low" },
  { value: "desc", label: "Points - low to high" },
];

export const LeaderboardsTable = <T extends LeaderboardData>(props: Props<T>) => {
  const { address } = useAccount();
  const [sorting, setSorting] = useState<SortingState>([])

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

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
          console.log('totalStaked', value);

          return (
            <div
              className={clsx({
                [styles.userWalletText]: userWallet,
              })}
            >
              {formatNumber(formatUnits(value as bigint, 9), 2)}
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
          console.log('totalPoints', value);
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
    columns,
    data: props.data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: props.showPagination ? {
      pagination,
      sorting
    } : undefined,
  });

  const handleSortOrderChange = (value: string) =>
    setSorting([{ id: 'totalPoints', desc: value !== 'desc' }]);

  return (
    <>
      <div
        className={clsx(
          styles.flexRow,
          css({
            flexDirection: "column !important",
            lg: { flexDirection: "row !important" },
          })
        )}
      >
        <div className={styles.title}>Leaderboard</div>
        {props.showPagination && (
          <div
            className={clsx(
              styles.flexRow,
              css({
                flexDirection: "column !important",
                lg: { flexDirection: "row !important" },
              })
            )}
          >
            <label className={styles.sortByLabel}>Sort by</label>
            <Dropdown
              items={dropdownItems}
              defaultSelected={dropdownItems[0]}
              onSelect={(value) => handleSortOrderChange(value)}
            />
          </div>
        )}
      </div>
      <div className={clsx(styles.flexRow,
        css({
          hideFrom: "md", width: "100%",
          flexDirection: "column !important",
          lg: { flexDirection: "row !important" },
        }))}>
        {
          table.getRowModel().rows.length ? (
            <>
              {table.getRowModel().rows.map((row) => {
                const firstCell = row.getAllCells()[0];
                const walletAddress = row.getAllCells()[1].getContext().getValue()
                return (
                  <div
                    key={row.id}
                    style={{
                      width: '100%',
                      display: "flex",
                      flexDirection: "column",
                      gap: "0rem",
                      padding: "1.2rem 0",
                      borderBottom: "1px solid #999999",
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        marginBottom: "1.2rem",
                        color: "#1E1e1e",
                        fontWeight: "700",
                        fontSize: "1.8rem",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.8rem',
                      }}
                    >
                      <div className={css({
                        textAlign: "center",
                        width: "3.3rem",
                      })}>
                        {flexRender(
                          firstCell?.column?.columnDef?.cell,
                          firstCell?.getContext()
                        )}
                      </div>
                      {isUserWallet(walletAddress as string, address as string) && (
                        <Badge variant="table" title="You" />
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
                                display: "flex",
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                '&:first-child': {
                                  justifyContent: "flex-start",
                                },
                                '&:last-child': {
                                  justifyContent: "flex-end",
                                },
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
                              display: "flex",
                              flex: 1,
                              alignItems: "center",
                              justifyContent: "center",
                              '&:first-child': {
                                justifyContent: "flex-start",
                              },
                              '&:last-child': {
                                justifyContent: "flex-end",
                              },
                            })}
                            key={cell.id}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
            </>) : (
            <div className={styles.tableCell}>
              <i>No data to display yet</i>
            </div>
          )
        }
      </div >
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
        {props.showPagination && <div className={styles.pagination}>
          <div>
            <div className={styles.paginationText}>
              Showing {table.getState().pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min((table.getState().pagination.pageIndex + 1) * pagination.pageSize, table.getRowCount())} of{' '}
              {table.getRowCount().toLocaleString()} results
            </div>
          </div>
          <div className={styles.paginationButtons}>
            <button
              className={styles.paginationButton}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <MdKeyboardArrowLeft fontSize="2rem" />
            </button>
            {Array.from({ length: Math.ceil(table.getRowCount() / pagination.pageSize) }, (_, index) => index + 1)
              .map((page) => {
                const isCurrentPage = page === table.getState().pagination.pageIndex + 1;
                return (
                  <button
                    key={page}
                    className={clsx(styles.paginationButton, { [styles.active]: isCurrentPage })}
                    onClick={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </button>
                );
              })
              .reduce((acc, curr, index, array) => {
                if (index > 0 && index < array.length - 1 && (curr.props.children - array[index - 1].props.children > 1)) {
                  acc.push(<span key={`ellipsis-${index}`}>...</span>);
                }
                acc.push(curr);
                return acc;
              }, [] as React.ReactNode[])
            }
            <button
              className={styles.paginationButton}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <MdKeyboardArrowRight fontSize="2rem" />
            </button>
          </div>
        </div>}
      </div>
    </>
  );
};
