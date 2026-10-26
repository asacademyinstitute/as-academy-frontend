import { redirect } from 'next/navigation';

export default async function VerifyShortPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const params = await searchParams;
    const id = params?.id || params?.cert || params?.number;
    if (id) {
        redirect(`/verify-certificate?id=${encodeURIComponent(id)}`);
    }
    redirect('/verify-certificate');
}
