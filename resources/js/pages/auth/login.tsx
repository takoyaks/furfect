import { useState } from 'react';
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
    const [remember, setRemember] = useState(false);
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
                                <input type="hidden" name="remember" value={remember ? 'true' : 'false'} />
                                <Checkbox
                                    id="remember"
                                    name="remember_ui"
                                    checked={remember}
                                    onCheckedChange={(checked) => setRemember(Boolean(checked))}
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

                            <div className="relative my-0.5 text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-neutral-200 dark:after:border-neutral-800">
                                <span className="relative z-10 bg-white dark:bg-neutral-900 px-3 text-neutral-400 font-medium">
                                    or continue with
                                </span>
                            </div>

                            <a
                                href="/auth/google/redirect"
                                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-2.5 px-4 text-xs sm:text-sm font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 transition-all duration-150 cursor-pointer dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                            >
                                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                Continue with Google
                            </a>
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
