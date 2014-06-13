<p><a href="{crmURL p='civicrm/admin/simple-mail/headers/new' q='reset=1'}">Add new mailing header</a></p>

{if $headers}
    <div>
        {include file="CRM/common/enableDisable.tpl"}
        <table class="selector">
            <tr class="columnheader">
                <th>{ts}Label{/ts}</th>
                <th>{ts}Thumbnail{/ts}</th>
                <th>{ts}Show logo{/ts}</th>
                <th></th>
            </tr>
            {foreach from=$headers item=header}
                <tr id="row_{$header.id}"
                    class="{cycle values="odd-row,even-row"} {if NOT $header.is_active} disabled{/if}">
                    <td class="crm-simplemail-header-label">{$header.label}</td>
                    <td class="crm-simplemail-header-thumbnail">{$header.thumbnail}</td>
                    <td class="crm-simplemail-header-show-logo">{$header.show_logo}</td>
                    <td>{$header.action|replace:'xx':$header.id}</td>
                </tr>
            {/foreach}
        </table>
   </div>
{/if}
