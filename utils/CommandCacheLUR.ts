class Node<V> {
    prev: Node<V> | null = null;
    next: Node<V> | null = null;
    value: V;
    constructor(value: V) {
        this.value = value;
    }
}

interface Options {
    maxSize?: number;
}
export class CommandCacheLUR {
    #maxSize: number;
    #size: number = 0;
    #nodeMap: Map<string, Node<string>> = new Map();
    #head: Node<string> | null = null;
    #tail: Node<string> | null = null;
    constructor(entries?: readonly (string)[], options: Options = {}) {
        const { maxSize = 30 } = options;
        this.#maxSize = maxSize;
        if (entries) {
            if (this.#maxSize < entries.length) throw new Error("传入的二维数组长度不能大于：" + maxSize);
            for (const value of entries) {
                this.#size++;
                const node = new Node(value);
                this.#nodeMap.set(value, node);
                this.#addToTail(node);
            }
        }
    }

    get size() {
        return this.#size;
    }

    #addToTail(node: Node<string>) {
        if (this.#head === null) this.#head = this.#tail = node;
        else {
            this.#tail!.next = node;
            node.prev = this.#tail;
            this.#tail = node;
        }
    }

    add(value: string): this {
        const existingNode = this.#nodeMap.get(value);
        if (existingNode) {
            if (existingNode.prev) existingNode.prev.next = existingNode.next;
            if (existingNode.next) existingNode.next.prev = existingNode.prev;
            if (this.#head === existingNode) this.#head = existingNode.next;
            if (this.#tail === existingNode) this.#tail = existingNode.prev;
            this.#size--;
        }

        if (this.#size >= this.#maxSize) {
            const headValue = this.#head?.value;
            const nextNode = this.#head?.next;
            if (nextNode) {
                this.#head = nextNode;
                nextNode.prev = null;
            } else {
                this.#head = this.#tail = null;
            }
            if (headValue !== undefined) {
                this.#nodeMap.delete(headValue);
            }
            this.#size--;
        }

        const node = new Node(value);
        this.#nodeMap.set(value, node);
        this.#addToTail(node);
        this.#size++;
        return this;
    }

    get(reg: RegExp): string | undefined {
        let node = this.#tail;
        while (node !== null) {
            if (reg.test(node.value)) break;
            node = node.prev;
        }
        if (node) {
            if (this.#tail !== node) {
                if (this.#head === node) {
                    this.#head = node.next;
                    if (node.next) {
                        node.next.prev = null;
                    }
                } else {
                    const prevNode = node.prev;
                    const nextNode = node.next;
                    if (prevNode) prevNode.next = nextNode;
                    if (nextNode) nextNode.prev = prevNode;
                }
                node.next = null;
                node.prev = this.#tail;
                if (this.#tail) this.#tail.next = node;
                this.#tail = node;
            }
        }
        return node?.value;
    }

    clear() {
        this.#head = this.#tail = null;
        this.#size = 0;
        this.#nodeMap.clear();
    }

    valueOf() {
        const result: string[] = [];
        let current = this.#head;
        while (current !== null) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }
}

// const lur = new CommandCacheLUR(["image --list", "image --list -k id,name,views,downloads", "clear"]);
// console.log(lur.get(/^ima/));
// console.log(lur.toString());
// lur.add("image --list");
// console.log(lur.toString());
// lur.add("clear --history");
// console.log(lur.toString());
