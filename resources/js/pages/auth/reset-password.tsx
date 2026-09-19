import { Form, Head } from '@inertiajs/react';
import { Mail, KeyRound } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Reset Password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <div className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                readOnly
                                leftIcon={<Mail className="size-4 text-muted-foreground" />}
                                className="bg-muted/50 cursor-not-allowed"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password">New Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                autoFocus
                                placeholder="Enter your new password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password_confirmation">
                                Confirm New Password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="Confirm your new password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full bg-[#D99B00] hover:bg-[#C28A00] text-white font-semibold transition shadow-xs cursor-pointer"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner className="size-4" />}
                            {!processing && <KeyRound className="size-4" />}
                            Reset Password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset Password',
    greeting: 'Set New Password',
    description: 'Please enter your new credentials below',
};
