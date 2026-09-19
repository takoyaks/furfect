import { Form, Head } from '@inertiajs/react';
import { Mail, LogIn } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email or Username</Label>
                                <Input
                                    id="email"
                                    type="text"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="username"
                                    placeholder="kerbie or name@example.com"
                                    leftIcon={<Mail className="size-4 text-muted-foreground" />}
                                    className="rounded-xl focus-visible:ring-[#FFBF00] focus-visible:border-[#FFBF00]"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-semibold text-[#467235] hover:text-[#283F24] hover:underline"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="rounded-xl focus-visible:ring-[#FFBF00] focus-visible:border-[#FFBF00]"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-[#FFBF00] data-[state=checked]:bg-[#FFBF00] data-[state=checked]:text-[#283F24] data-[state=checked]:border-[#FFBF00] rounded-md"
                                />
                                <Label htmlFor="remember" className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
                                    Remember me on this device
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-[#FFBF00] hover:bg-[#E5A910] active:bg-[#D99B00] text-[#283F24] font-bold py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer text-sm"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner className="size-4" />}
                                {!processing && <LogIn className="size-4" />}
                                Log In
                            </Button>
                        </div>

                        <div className="text-center text-xs sm:text-sm text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            Don't have an account?{' '}
                            <TextLink href={register()} tabIndex={6} className="font-bold text-[#283F24] hover:text-[#467235] hover:underline dark:text-amber-400">
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Log in',
    greeting: 'Welcome back!',
    description: 'Enter your email and password to log in',
};
