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

        public int count;



        public void LoginPermissions()
        {
            try
            {

                Banco.OpenConnection();


                Banco.Command = new MySqlCommand("SELECT id FROM escolas WHERE nome=@nome AND senha=@senha", Banco.Connection);


                Banco.Command.Parameters.AddWithValue("@nome", nome);
                Banco.Command.Parameters.AddWithValue("@senha", senha);


                idEscola = Convert.ToInt32(Banco.Command.ExecuteScalar());

            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                Banco.CloseConnection();
            }
        }


        public void SignIn()
        {
            try
            {

                Banco.OpenConnection();


                Banco.Command = new MySqlCommand("SELECT COUNT(*) FROM escolas WHERE nome=@nome AND senha=@senha", Banco.Connection);


                Banco.Command.Parameters.AddWithValue("@nome", nome);
                Banco.Command.Parameters.AddWithValue("@senha", senha);

      
                 count = Convert.ToInt32(Banco.Command.ExecuteScalar());

                Banco.CloseConnection();

                if (count > 0)
                {
                    MessageBox.Show("Login realizado com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    LoginPermissions();

                 
                    frmMainMenu check = new frmMainMenu(nome);
                    check.Show();

                  

                }
                else
                {
                    MessageBox.Show("Nome ou senha incorretos.", "Erro de Login", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                Banco.CloseConnection();
            }
        }
    }
}

