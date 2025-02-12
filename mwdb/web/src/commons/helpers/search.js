export function escapeSearchValue(input) {
    if (typeof input === "string") {
        input = JSON.stringify(input);
    } else {
        input = String(input);
    }
    return input;
}

export function escapeSearchField(field) {
    return field.replace(/[.\\ *:]/g, "\\$&");
}

export function makeSearchParams({ field, value, noEscape = false }) {
    return (
        "?" +
        new URLSearchParams({
            q: `${field}:${noEscape ? value : escapeSearchValue(value)}`,
        }).toString()
    );
}

export function makeSearchLink({ field, value, noEscape = false, pathname }) {
    return {
        pathname,
        search: makeSearchParams({ field, value, noEscape }),
    };
}

export function makeSearchConfigLink({ field, value, pathname }) {
    return makeSearchLink({
        pathname,
        field: `cfg.${field.join(".")}`,
        value,
    });
}

export function makeSearchDateLink({ field, value, pathname }) {
    return makeSearchLink({
        pathname,
        field,
        value: new Date(value).toISOString().split("T")[0],
        noEscape: true,
    });
}

export function isHash(element) {
    return (
        /^[0-9a-fA-F]{8}$/g.test(element) ||
        /^[0-9a-fA-F]{32}$/g.test(element) ||
        /^[0-9a-fA-F]{40}$/g.test(element) ||
        /^[0-9a-fA-F]{64}$/g.test(element) ||
        /^[0-9a-fA-F]{128}$/g.test(element)
    );
}

export function multiFromHashes(query) {
    const elements = query.split(/\s+/);
    if (elements.every(isHash))
        return `multi:"${elements.join(" ").toLowerCase()}"`;
    return query;
}

export function addFieldToQuery(query, field, value) {
    const OP_NOT = "NOT ";
    const OP_AND = " AND ";
    const OP_PRE_AND = "AND ";

    let negateQueryComponent = (component) =>
        component.startsWith(OP_NOT)
            ? component.substring(OP_NOT.length)
            : OP_NOT + component;

    let queryComponent = `${field}:${escapeSearchValue(value)}`;
    if (!query) {
        query = queryComponent;
    } else {
        if (field.startsWith(OP_NOT)) {
            // Let ~negated query pass condition
            if (query.includes(queryComponent)) {
            }
            // Remove AND ~query
            else if (
                query.includes(OP_AND + negateQueryComponent(queryComponent))
            )
                query = query.replace(
                    OP_AND + negateQueryComponent(queryComponent),
                    ""
                );
            // Remove ~query
            else if (query.includes(negateQueryComponent(queryComponent)))
                query = query.replace(negateQueryComponent(queryComponent), "");
            // Add ~query
            else query = query + OP_AND + queryComponent;
        }
        // Remove AND ~negated query
        else if (query.includes(OP_AND + negateQueryComponent(queryComponent)))
            query = query.replace(
                OP_AND + negateQueryComponent(queryComponent),
                ""
            );
        // Remove ~negated query
        else if (query.includes(negateQueryComponent(queryComponent)))
            query = query.replace(negateQueryComponent(queryComponent), "");
        // Remove duplicated query
        else if (!query.includes(queryComponent))
            query = query + OP_AND + queryComponent;
    }

    query = query.trim();
    if (query.startsWith(OP_PRE_AND))
        query = query.substring(OP_PRE_AND.length);
    return query;
}
