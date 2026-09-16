import { Form, Head } from '@inertiajs/react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                    {status}
                </div>
            )}

            <div className="space-y-5">
                <Form {...email.form()} className="space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="name@example.com"
                                    leftIcon={<Mail className="size-4 text-muted-foreground" />}
                                    className="focus-visible:ring-[#D99B00]"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-[#D99B00] hover:bg-[#C28A00] text-white font-semibold transition shadow-xs mt-2 cursor-pointer"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && <Spinner className="size-4" />}
                                {!processing && <Send className="size-4" />}
                                Send Password Reset Link
                            </Button>
                        </>
                    )}
                </Form>

                <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border/60">
                    <TextLink
                        href={login()}
                        className="inline-flex items-center gap-1.5 font-semibold text-[#D99B00] hover:underline"
                    >
                        <ArrowLeft className="size-3.5" /> Return to Log In
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot Password',
    greeting: 'Reset Your Password',
    description: 'Enter your registered email and we will send you a reset link',
};
