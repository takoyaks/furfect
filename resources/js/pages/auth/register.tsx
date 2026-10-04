import { useState } from 'react';
import { Form, Head, usePage } from '@inertiajs/react';
import { User, Mail, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import Captcha from '@/components/captcha';
import { TermsAndPoliciesModal } from '@/components/terms-and-policies-modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { DEFAULT_AGREEMENT_CONTENT } from '@/config/agreement-content';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const { systemSettings } = usePage().props as any;
    const consentLabel =
        systemSettings?.consent_agreement_label?.trim() ||
        DEFAULT_AGREEMENT_CONTENT.registrationConsentLabel;

    const [termsAgreed, setTermsAgreed] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    // Real-time email uniqueness check state
    const [emailCheck, setEmailCheck] = useState<{
        checking: boolean;
        available?: boolean;
        message?: string;
    } | null>(null);

    const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const email = e.target.value.trim();
        if (!email || !email.includes('@') || !email.includes('.')) {
            setEmailCheck(null);
            return;
        }

        setEmailCheck({ checking: true });
        try {
            const res = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            setEmailCheck({
                checking: false,
                available: Boolean(data.available),
                message: data.message,
            });
        } catch {
            setEmailCheck(null);
        }
    };

    return (
        <>
            <Head title="Create an account" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="e.g. Juan dela Cruz"
                                    leftIcon={<User className="size-4 text-muted-foreground" />}
                                    className="rounded-xl focus-visible:ring-[#FFBF00] focus-visible:border-[#FFBF00]"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    leftIcon={<Mail className="size-4 text-muted-foreground" />}
                                    onBlur={handleEmailBlur}
                                    onChange={() => setEmailCheck(null)}
                                    className={`rounded-xl focus-visible:ring-[#FFBF00] focus-visible:border-[#FFBF00] ${
                                        emailCheck && !emailCheck.checking && emailCheck.available === false
                                            ? 'border-destructive focus-visible:ring-destructive/20'
                                            : ''
                                    }`}
                                />
                                {emailCheck?.checking && (
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                        <Spinner className="size-3" /> Checking email availability...
                                    </span>
                                )}
                                {emailCheck && !emailCheck.checking && emailCheck.available === false && (
                                    <div className="flex items-start gap-1.5 text-xs text-destructive mt-0.5">
                                        <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                                        <span>
                                             {emailCheck.message}{' '}
                                            <TextLink href={login()} className="font-semibold underline">
                                                Log in here
                                            </TextLink>
                                        </span>
                                    </div>
                                )}
                                {emailCheck && !emailCheck.checking && emailCheck.available === true && (
                                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-0.5">
                                        <CheckCircle2 className="size-3.5" /> {emailCheck.message}
                                    </span>
                                )}
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Enter your password"
                                    passwordrules={passwordRules}
                                    className="rounded-xl focus-visible:ring-[#FFBF00] focus-visible:border-[#FFBF00]"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Re-enter your password"
                                    passwordrules={passwordRules}
                                    className="rounded-xl focus-visible:ring-[#FFBF00] focus-visible:border-[#FFBF00]"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Terms & Conditions agreement checkbox */}
                            <div className="space-y-1.5 pt-1">
                                <input
                                    type="hidden"
                                    name="terms_agreed"
                                    value={termsAgreed ? '1' : ''}
                                />
                                <div className="flex items-start space-x-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                                    <Checkbox
                                        id="terms_agreed"
                                        checked={termsAgreed}
                                        onCheckedChange={(checked) => {
                                             setTermsAgreed(Boolean(checked));
                                        }}
                                        className="mt-0.5 border-[#FFBF00] data-[state=checked]:bg-[#FFBF00] data-[state=checked]:text-[#283F24] data-[state=checked]:border-[#FFBF00] rounded-md"
                                    />
                                    <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-snug">
                                        <label htmlFor="terms_agreed" className="cursor-pointer select-none">
                                            {consentLabel}{' '}
                                        </label>
                                        <TermsAndPoliciesModal
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="font-bold text-[#467235] underline hover:text-[#283F24] inline-block cursor-pointer ml-0.5"
                                                >
                                                    View Terms &amp; Policies
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>
                                <InputError message={errors.terms_agreed} />
                            </div>

                            {/* CAPTCHA Security Check */}
                            <div className="space-y-1">
                                <input
                                    type="hidden"
                                    name="captcha_verified"
                                    value={captchaVerified ? '1' : ''}
                                />
                                <Captcha
                                    onVerify={(verified) => {
                                         setCaptchaVerified(verified);
                                    }}
                                    error={errors.captcha_verified}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-[#FFBF00] hover:bg-[#E5A910] active:bg-[#D99B00] text-[#283F24] font-bold py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer text-sm"
                                tabIndex={5}
                                disabled={processing || (emailCheck?.available === false)}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner className="size-4" />}
                                {!processing && <UserPlus className="size-4" />}
                                Create Account
                            </Button>

                            <div className="relative my-0.5 text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-neutral-200 dark:after:border-neutral-800">
                                <span className="relative z-10 bg-white dark:bg-neutral-900 px-3 text-neutral-400 font-medium">
                                    or sign up with
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
                                Sign up with Google
                            </a>
                        </div>

                        <div className="text-center text-xs sm:text-sm text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6} className="font-bold text-[#283F24] hover:text-[#467235] hover:underline dark:text-amber-400">
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Register',
    greeting: 'Welcome to FurFect Match',
    description: 'Enter your details below to create your account',
};
