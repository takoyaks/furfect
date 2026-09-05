import { Form, Head } from '@inertiajs/react';
import { MailCheck, RotateCcw, LogOut } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verify Email" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                    A new verification link has been sent to your registered email address.
                </div>
            )}

            <Form {...send.form()} className="space-y-4 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            disabled={processing}
                            className="w-full bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold transition shadow-xs"
                        >
                            {processing && <Spinner className="size-4" />}
                            {!processing && <RotateCcw className="size-4" />}
                            Resend Verification Email
                        </Button>

                        <div className="pt-2 border-t border-border/60">
                            <TextLink
                                href={logout()}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="size-3.5" /> Log out
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify Email',
    greeting: 'Check Your Inbox',
    description:
        'Please verify your email address by clicking on the link we just sent to you.',
};
