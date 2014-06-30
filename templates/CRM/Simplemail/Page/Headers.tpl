<div ng-app="simpleMailApp">
    {*{literal}{{1+4}}{/literal}*}
    <div ng-controller="MessagesAdminController">
        <p><a href="">Add new campaign messages</a></p>
        <table>
            <thead>
            <tr>
                <td>ID</td>
                <td>Label</td>
                <td>Text</td>
                <td>Is active</td>
                <td></td>
            </tr>
            </thead>
            <tr ng-repeat="message in messages">
                <td>{literal}{{message.id}}{/literal}</td>
                <td>{literal}{{message.label}}{/literal}</td>
                <td>{literal}{{message.text}}{/literal}</td>
                <td>{literal}{{message.isActive}}{/literal}</td>
                <td><a ng-href="messages/new/{{message.id}}" class="button">Edit</a></td>
            </tr>
        </table>

        <p><a href="">Add new campaign messages</a></p>
    </div>
    {*
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
    *}
</div>