import { createSessionHref } from '@/utils/sessionNavigation';
import { usePathname, useRouter } from "expo-router"

export function useNavigateToSession() {
    const router = useRouter();
    const pathname = usePathname();
    return (sessionId: string) => {
        router.navigate(createSessionHref(sessionId, pathname), {
            dangerouslySingular(name, params) {
                return 'session'
            },
        });
    }
}
