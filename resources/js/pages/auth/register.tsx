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
