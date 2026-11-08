// Placeholder contact details — replace with NewsX's real contact info later.
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-headline text-2xl font-bold">Contact Us</h1>
      <p className="text-neutral-700">
        Have a tip, correction, or question? Reach out through any of the channels below.
      </p>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="inline font-medium text-neutral-500">Email: </dt>
          <dd className="inline">
            <a href="mailto:contact@newsx.example" className="text-accent hover:underline">
              contact@newsx.example
            </a>
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-neutral-500">WhatsApp: </dt>
          <dd className="inline">+880 1XXX-XXXXXX</dd>
        </div>
        <div>
          <dt className="inline font-medium text-neutral-500">Address: </dt>
          <dd className="inline">Placeholder address, Dhaka, Bangladesh</dd>
        </div>
      </dl>
      <p className="text-sm text-neutral-500">
        These are placeholder details — real contact information will be added here.
      </p>
    </div>
  );
}
