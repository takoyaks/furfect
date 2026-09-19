import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm Password" />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="space-y-5">
                        <div className="grid gap-1.5">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Enter your current password"
                                autoComplete="current-password"
                                autoFocus
                                className="rounded-xl focus-visible:ring-[#FFBF00] focus-visible:border-[#FFBF00]"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#FFBF00] hover:bg-[#E5A910] active:bg-[#D99B00] text-[#283F24] font-bold py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer text-sm"
                            disabled={processing}
                            data-test="confirm-password-button"
                        >
                            {processing && <Spinner className="size-4" />}
                            {!processing && <ShieldCheck className="size-4" />}
                            Confirm Password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm Password',
    greeting: 'Confirm Your Password',
    description:
        'This is a secure area of the application. Please confirm your password before continuing.',
};
