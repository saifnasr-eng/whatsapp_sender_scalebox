# -*- coding: utf-8 -*-
#
# DEPRECATED (since 18.0.1.0.1): this file is no longer used.
#
# Combining an AbstractModel mixin into an existing concrete model via
# `_inherit = ['account.move', 'whatsapp.share.mixin']` triggered a field
# registry conflict on installation in a real customer environment:
#
#   TypeError: Many2many fields AccountMove.matched_payment_ids and
#   account.move.matched_payment_ids use the same table and columns
#
# To avoid any risk of similar registry conflicts (which can depend on the
# exact combination of other installed/custom modules on a given server),
# each model (account.move, sale.order, purchase.order) now implements its
# own small, self-contained "action_get_whatsapp_pdf" method directly via
# plain `_inherit = '<model>'`, instead of sharing logic through this
# mixin. See models/account_move.py, models/sale_order.py and
# models/purchase_order.py.
#
# This file is kept only as a documented placeholder and can be safely
# deleted; it is not imported anymore (see models/__init__.py).
