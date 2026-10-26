import { redirect } from 'next/navigation';

export default function VerifyShortRedirect({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    // If id or cert query params are passed, forward them to /verify-certificate
    return (
        <RedirectHandler searchParamsPromise={searchParams} />
    );
}

async function RedirectHandler({ searchParamsPromise }: { searchParamsPromise: Promise<{ [key: string]: string | undefined }> }) {
    const params = await searchParamsPromise;
    const id = params?.id || params?.cert || params?.number;
    if (id) {
        redirect(`/verify-certificate?id=${encodeURIComponent(id)}`);
    }
    redirect('/verify-certificate');
}
