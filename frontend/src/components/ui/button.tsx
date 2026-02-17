import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-border bg-background hover:bg-muted hover:border-primary/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-soft active:scale-[0.98]",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Collee specific variants
        collee: "text-primary-foreground shadow-soft-md active:scale-[0.98] py-4 px-8 text-lg font-medium hover:shadow-glow" + " [background:var(--gradient-primary)] hover:brightness-110",
        "collee-accent": "text-secondary-foreground shadow-soft-md active:scale-[0.98] py-4 px-8 text-lg font-medium hover:shadow-warm" + " [background:var(--gradient-accent)] hover:brightness-110",
        "collee-secondary": "bg-muted text-foreground hover:bg-muted/80 border border-border py-3 px-6",
        "collee-ghost": "text-muted-foreground hover:text-foreground hover:bg-muted py-3 px-4",
        "collee-outline": "border-2 border-border bg-transparent text-foreground hover:bg-muted hover:border-primary/30 py-3 px-6",
        // Accent variant for special CTAs
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-soft active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-lg",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        // Collee sizes
        collee: "h-14 px-8",
        "collee-sm": "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
