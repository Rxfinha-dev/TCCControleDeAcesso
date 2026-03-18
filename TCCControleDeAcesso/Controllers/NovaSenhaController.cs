using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TCCControleDeAcesso.Models;
using MySql.Data.MySqlClient;
using System.Windows.Forms;

namespace TCCControleDeAcesso.Controllers
{
    public class NovaSenhaController
    {
        //acredito que possamos juntar essa nova senha em alguma outra controller e assim eleminar esse arquivo
        //public string senha { get; set; }
        //public string email { get; set; }


        //Movido para EmpresasController
        //public void ChangePasswod()
        //{
        //    try
        //    {
        //        //Banco.OpenConnection();

        //        Banco.Command = new MySqlCommand("update escolas set senha=@senha where email=@email", Banco.Connection);
        //        Banco.Command.Parameters.AddWithValue("@senha", senha);
        //        Banco.Command.Parameters.AddWithValue("@email", email);

        //        Banco.Command.ExecuteNonQuery();

        //        //Banco.CloseConnection();
        //    }
        //    catch (Exception e)
        //    {
        //        MessageBox.Show("Erro", e.Message, MessageBoxButtons.OK, MessageBoxIcon.Error);
        //    }
        //}

    }
}
