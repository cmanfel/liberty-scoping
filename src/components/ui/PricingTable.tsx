import { pricingRows } from "@/content/pricing";

export function PricingTable({ idPrefix = "pricing" }: { idPrefix?: string }) {
  return (
    <div>
      <div className="hidden overflow-hidden rounded-md border border-line md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Starting rates and minimum invoice amounts by service
          </caption>
          <thead className="bg-surface text-sm uppercase tracking-[0.14em] text-gold">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">
                Service
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Starting rate
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold">
                Minimum invoice
              </th>
            </tr>
          </thead>
          <tbody>
            {pricingRows.map((row) => (
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
                <td className="px-6 py-5 text-right">
                  <span className="font-serif text-3xl font-semibold lining-nums text-gold-bright">
                    {row.rate}
                  </span>
                  <span className="text-fog">{row.unit}</span>
                </td>
                <td className="px-6 py-5 text-right text-lg text-ivory">
                  {row.minimumInvoice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul
        className="grid gap-4 md:hidden"
        aria-label="Starting rates by service"
      >
        {pricingRows.map((row) => (
          <li key={`${idPrefix}-${row.id}`} className="card-surface p-5">
            <h3 className="font-serif text-xl font-semibold leading-snug text-ivory">
              {row.service}
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                  Starting rate
                </dt>
                <dd className="mt-1">
                  <span className="font-serif text-3xl font-semibold lining-nums text-gold-bright">
                    {row.rate}
                  </span>
                  <span className="text-fog">{row.unit}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                  Minimum invoice
                </dt>
                <dd className="mt-1 text-xl text-ivory">
                  {row.minimumInvoice}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
