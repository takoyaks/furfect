import { useState } from 'react';
import { Form, Head } from '@inertiajs/react';
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
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors, setData }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Terms & Conditions agreement checkbox with viewer */}
                            <div className="space-y-2 pt-2">
                                <input
                                    type="hidden"
                                    name="terms_agreed"
                                    value={termsAgreed ? '1' : ''}
                                />
                                <div className="flex items-start space-x-3 bg-amber-50/50 border border-amber-200/60 p-3 rounded-lg">
                                    <Checkbox
                                        id="terms_agreed"
                                        checked={termsAgreed}
                                        onCheckedChange={(checked) => {
                                            const val = Boolean(checked);
                                            setTermsAgreed(val);
                                            setData('terms_agreed', val ? '1' : '');
                                        }}
                                        className="mt-0.5 border-amber-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                                    />
                                    <div className="text-xs text-gray-700 leading-snug">
                                        <label htmlFor="terms_agreed" className="cursor-pointer select-none">
                                            I agree to the terms and condition of Furfect Match and the Virac Animal Shelter Adoption policies.
                                        </label>{' '}
                                        <TermsAndPoliciesModal
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="font-semibold text-[#D4A017] underline hover:text-[#B8860B] inline-block"
                                                >
                                                    View Terms &amp; Policies
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>
                                <InputError message={errors.terms_agreed} />
                            </div>

                            {/* Simple CAPTCHA Security Check */}
                            <div className="space-y-1">
                                <input
                                    type="hidden"
                                    name="captcha_verified"
                                    value={captchaVerified ? '1' : ''}
                                />
                                <Captcha
                                    onVerify={(verified) => {
                                        setCaptchaVerified(verified);
                                        setData('captcha_verified', verified ? '1' : '');
                                    }}
                                    error={errors.captcha_verified}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-[#D4A017] hover:bg-[#B8860B] text-white font-semibold"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
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
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
