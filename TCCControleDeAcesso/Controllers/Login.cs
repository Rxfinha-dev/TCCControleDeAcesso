using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;
using TCCControleDeAcesso.Views;

namespace TCCControleDeAcesso.Controllers
{
    public class Login
    {
        public int id { get; set; }
        public string nome { get; set; }
        public string senha { get; set; }
        public int idEscola { get; set; }

        public string HashBanco { get; set; }

        public int count;



        public void LoginPermissions()
        {
            try
            {
                Banco.OpenConnection();

                Banco.Command = new MySqlCommand("select id from escolas where nome=@nome", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@nome", nome);

                using (MySqlDataReader reader = Banco.Command.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        idEscola = reader.GetInt32("id"); // aqui era um GetInt32 antes
                    }
                }

            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Erro ao guardar o id ", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }


        /// <summary>
        /// ////////////////////////////////////////////
        /// </summary>


        public void PullSenha()
        {
            try
            {
                Banco.OpenConnection();

                Banco.Command = new MySqlCommand("SELECT COUNT(*) FROM escolas WHERE nome=@nome", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@nome", nome);
                count = Convert.ToInt32(Banco.Command.ExecuteScalar());

                if (count > 0)
                {
                    // Busca apenas a senha (hash) direto
                    using (var cmd = new MySqlCommand("SELECT senha FROM escolas WHERE nome=@nome LIMIT 1", Banco.Connection))
                    {
                        cmd.Parameters.AddWithValue("@nome", nome);

                        var result = cmd.ExecuteScalar();

                        if (result != null)
                        {
                            HashBanco = result.ToString();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Erro ao puxar a senha", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                Banco.CloseConnection();
            }
        }
    }
}
/// <summary>
/// ///////////////////////////////////////////
/// </summary>


//public void SignIn()
//{
//try
//{

//    Banco.OpenConnection();


//    Banco.Command = new MySqlCommand("SELECT COUNT(*) FROM escolas WHERE nome=@nome AND senha=@senha", Banco.Connection);


//    Banco.Command.Parameters.AddWithValue("@nome", nome);
//    Banco.Command.Parameters.AddWithValue("@senha", senha);


//    count = Convert.ToInt32(Banco.Command.ExecuteScalar());

//    Banco.CloseConnection();
//}

//        if (count > 0)
//        {
//            LoginPermissions();
//            MessageBox.Show("Login realizado com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information);          
//            frmMainMenu check = new frmMainMenu(nome, idEscola);                  
//            check.Show();



//        }
//        else
//        {
//            MessageBox.Show("Nome ou senha incorretos.", "Erro de Login", MessageBoxButtons.OK, MessageBoxIcon.Error);
//        }
//    }
//    catch (Exception e)
//    {
//        MessageBox.Show(e.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
//    }
//    finally
//    {
//        Banco.CloseConnection();
//   }
//}

