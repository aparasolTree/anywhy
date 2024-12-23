export function Tags({ href, tags, currentTag, title }: {
    href: string;
    title: string;
    tags: {
        tag: string;
        total?: number;
    }[];
    currentTag?: string | null;
}) {
    return (
        <div class="py-3">
            <h3 class="text-start text-2xl">{title}</h3>
            <ul class="py-3 flex">
                {tags.map(({ tag, total }) => (
                    <li id={tag}>
                        <a
                            href={`${href}?tag=${tag}`}
                            class={[
                                "px-3 py-2 rounded-md mx-2 border-2 hover:bg-gray-200",
                                currentTag === tag ? "text-gray-500 border-gray-500" : " border-gray-200",
                            ].join(" ")}
                        >
                            {tag}
                            {!!total && (
                                <span class="ml-2 text-sm p-1 text-gray-400">
                                    {total}
                                </span>
                            )}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
