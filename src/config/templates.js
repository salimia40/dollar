let templates = {}

templates.opfRow = `
<tr>
                <th scope="row">INDEX</th>
                <td class="DEAL-STYLE">DEAL</td>
                <td>AMOUNT</td>
                <td>PRICE</td>
                <td>CODE</td>
              </tr>
`

templates.opfTemp = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <style>
        * {
            text-align: center;
            direction: rtl;
        }
    </style>
</head>
<body>
    <div class="container mt-5">
        <div class="row">
            <div class="col-sm">logo here</div>
            <div class="col-sm">فاکتور های باز  NAME</div>
            <div class="col-sm"> تا تاریخ DATE</div>
        </div>
        <table class="table mt-5">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">خرید-فروش</th>
                <th scope="col">مقدار</th>
                <th scope="col">قیمت</th>
                <th scope="col">کد معامله</th>
              </tr>
            </thead>
            <tbody>
              ROWS
            </tbody>
          </table>
    </div>
</body>
</html>`

templates.mrRow = `<tr>
<th scope="row">INDEX</th>
<td class="DEAL-STYLE">DATE</td>
<td >RATE</td>
<td>PROFIT</td>
<td>COMMITION</td>
<td>SUM</td>
</tr>`

templates.mrRowLast = `<tr>
<th scope="row" colspan="3">جمع کل</th>
<td>PROFIT</td>
<td>COMMITION</td>
<td>SUM</td>
</tr>`

templates.mrTemp = `<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <style>
        * {
            text-align: center;
            direction: rtl;
        }
    </style>
</head>

<body>
    <div class="container mt-5">
        <div class="row">
            <div class="col-sm">logo here</div>
            <div class="col-sm">گزارش وضعیت ماهانه NAME</div>
        </div>
        <table class="table mt-5">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col"> تاریخ تسویه </th>
                    <th scope="col"> نرخ تسویه </th>
                    <th scope="col">سود و زیان</th>
                    <th scope="col">مجموع کمیسیون پرداختی</th>
                    <th scope="col">خالص</th>
                </tr>
            </thead>
            <tbody>
                ROWS
            </tbody>
        </table>
    </div>
</body>

</html>`

templates.psrRow = `<tr>
<th scope="row">CODE</th>
<td class="DEAL-STYLE">DEAL</td>
<td >CONDITION</td>
<td >AMOUNT</td>
<td >RATE</td>
<td>OPPO</td>
<td>DATE</td>
</tr>`

templates.psrTemp = `<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <style>
        * {
            text-align: center;
            direction: rtl;
        }
    </style>
</head>

<body>
    <div class="container mt-5">
        <div class="row">
            <div class="col-sm">logo here</div>
            <div class="col-sm">گزارش معاملات پس از تسویه</div>
        </div>
        <table class="table mt-5">
            <thead>
                <tr>
                    <th scope="col">شماره تراکنش</th>
                    <th scope="col"> خرید / فروش </th>
                    <th scope="col"> شرایط معامله </th>
                    <th scope="col">واحد </th>
                    <th scope="col">نرخ مظنه</th>
                    <th scope="col">طرف معامله</th>
                    <th scope="col">زمان ثبت معامله </th>
                </tr>
            </thead>
            <tbody>
                ROWS
            </tbody>
        </table>
    </div>
</body>

</html>`

templates.transRow = `<tr>
<th scope="row">CODE</th>
<td class="DEAL-STYLE">CHARGETYPE</td>
<td >AMOUNT</td>
<td >DATE</td>
<td >EXPLAIN</td>
</tr>`

templates.transTemp = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <style>
        * {
            text-align: center;
            direction: rtl;
        }
    </style>
</head>

<body>
    <div class="container mt-5">
        <div class="row">
            <div class="col-sm">logo here</div>
            <div class="col-sm">گزارش تراکنش های مالی</div>
        </div>
        <table class="table mt-5">
            <thead>
                <tr>
                    <th scope="col">شماره تراکنش</th>
                    <th scope="col"> واریز / برداشت </th>
                    <th scope="col"> مقدار (تومان) </th>
                    <th scope="col"> تاریخ </th>
                    <th scope="col">توضیحات</th>
                </tr>
            </thead>
            <tbody>
                ROWS

            </tbody>
        </table>
    </div>
</body>

</html>`

templates.userRow = `<tr>
<th scope="row">ID</th>
<td >ROLE</td>
<td >NAME</td>
<td>USERNAME</td>
<td>PHONE</td>
<td>CHARGE</td>
</tr>`

templates.userTable = `<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <style>
        * {
            text-align: center;
            direction: rtl;
        }
    </style>
</head>

<body>
    <div class="container mt-5">
        <table class="table mt-5">
            <thead>
                <tr>
                    <th scope="col">شماره کاربری</th>
                    <th scope="col"> نقش </th>
                    <th scope="col"> نام </th>
                    <th scope="col"> نام کاربری </th>
                    <th scope="col"> شماره تماس </th>
                    <th scope="col"> موجودی مالی </th>
                </tr>
            </thead>
            <tbody>
                ROWS

            </tbody>
        </table>
    </div>
</body>

</html>`

module.exports = templates