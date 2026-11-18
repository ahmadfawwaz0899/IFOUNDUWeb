import Image from "next/image";
import { EyeOff } from "lucide-react";
import { getCategory, type CategoryId } from "@/lib/categories";
import { photoUrl } from "@/lib/items";
import { cn } from "@/lib/utils";

/**
 * Item photo, or the category icon when there is none.
 * Sensitive items (IDs, cards) are blurred unless `reveal` is true.
 */
export function ItemPhoto({
  path,
  category,
  title,
  sensitive,
  reveal = false,
  sizes,
  className,
  iconClassName,
  priority,
}: {
  path: string | null;
  category: CategoryId;
  title: string;
  sensitive: boolean;
  reveal?: boolean;
  sizes: string;
  className?: string;
  iconClassName?: string;
  priority?: boolean;
}) {
  const { icon: Icon, label } = getCategory(category);
  const blurred = sensitive && !reveal;

  return (
    <div className={cn("relative overflow-hidden bg-secondary text-secondary-foreground", className)}>
      {path ? (
        <>
          <Image
            src={photoUrl(path)}
            alt={blurred ? `${title} (photo hidden for privacy)` : title}
            fill
            sizes={sizes}
            priority={priority}
            className={cn("object-cover", blurred && "scale-110 blur-xl")}
          />
          {blurred && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
              <EyeOff className="size-1/4 max-h-10 max-w-10" aria-hidden="true" />
            </span>
          )}
        </>
      ) : (
        <span className="flex size-full items-center justify-center">
          <Icon className={cn("size-7", iconClassName)} role="img" aria-label={label} />
        </span>
      )}
    </div>
  );
}
