import { turnaroundRows } from "@/content/turnaround";

const columns = [
  { key: "standard", label: "Standard" },
  { key: "priority", label: "Priority" },
  { key: "rush", label: "Rush" },
] as const;

export function TurnaroundTable() {
  return (
    <div>
      <div className="hidden overflow-hidden rounded-md border border-line md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Turnaround times by service and speed
          </caption>
          <thead className="bg-surface text-sm uppercase tracking-[0.14em] text-gold">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">
                Service
              </th>
              {columns.map((c) => (
                <th key={c.key} scope="col" className="px-6 py-4 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {turnaroundRows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-line bg-ink-2/60 transition-colors hover:bg-gold/5"
              >
                <th
                  scope="row"
                  className="px-6 py-5 text-lg font-medium text-ivory"
                >
                  {row.service}
                </th>
                {columns.map((c) => (
                  <td key={c.key} className="px-6 py-5 text-lg text-ivory">
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul
        className="grid gap-4 md:hidden"
        aria-label="Turnaround times by service"
      >
        {turnaroundRows.map((row) => (
          <li key={row.id} className="card-surface p-5">
            <h3 className="font-serif text-xl font-semibold leading-snug text-ivory">
              {row.service}
            </h3>
            <dl className="mt-4 divide-y divide-line border-t border-line">
              {columns.map((c) => (
                <div
                  key={c.key}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                    {c.label}
                  </dt>
                  <dd className="text-right text-[1.0625rem] text-ivory">
                    {row[c.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
