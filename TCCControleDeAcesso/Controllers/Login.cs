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
        public string email { get; set; }
        public int idEscola { get; set; }

        public string HashBanco { get; set; }

        public int count;



        public void LoginPermissions()
        {
            try
            {
                Banco.OpenConnection();

                Banco.Command = new MySqlCommand("select id from escolas where email=@email", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@email", email);

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

        public void PullSenha()
        {
            try
            {
                Banco.OpenConnection();

                Banco.Command = new MySqlCommand("SELECT COUNT(*) FROM escolas WHERE email=@email", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@email", email);
                count = Convert.ToInt32(Banco.Command.ExecuteScalar());

                if (count > 0)
                {
                    // Busca apenas a senha (hash) direto
                    using (var cmd = new MySqlCommand("SELECT senha FROM escolas WHERE email=@email LIMIT 1", Banco.Connection))
                    {
                        cmd.Parameters.AddWithValue("@email", email);

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


