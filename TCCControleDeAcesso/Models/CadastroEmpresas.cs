using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using System.Xml.Linq;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.ListView;

namespace TCCControleDeAcesso.Models
{
    public class CadastroEmpresas
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public string Email { get; set; }
        public string Senha { get; set; }

        public string HashBanco { get; set; }

      


        public void Insert()
        {
            try
            {
                Banco.OpenConnection();

                Banco.Command = new MySqlCommand("insert into escolas(id, nome, email,senha) " +
                    "values(@id, @nome,@email, @senha)", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", Id);
                Banco.Command.Parameters.AddWithValue("@nome", Name);
                Banco.Command.Parameters.AddWithValue("@email", Email);
                Banco.Command.Parameters.AddWithValue("@senha", Senha);
                Banco.Command.ExecuteNonQuery();


                Banco.CloseConnection();


            }
            catch (Exception e)
            {

                MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);

            }
        }

        public void Update()
        {
            try
            {
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("update escolas set nome = @nome, email=@email, senha=@senha where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", Id);
                Banco.Command.Parameters.AddWithValue("@nome", Name);
                Banco.Command.Parameters.AddWithValue("@email", Email);
                Banco.Command.Parameters.AddWithValue("@senha", Senha);

                Banco.Command.ExecuteNonQuery();
                Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Atualizar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        //possivel caca a ser feita(Eu Bruno vou fazer uma função para uxar a senha do nosso banco de dados)

        public void PullSenha()
        {
            try
            {
                Banco.OpenConnection();
                string HashBanco = null;

                using (var cmd = new MySqlCommand("SELECT senha FROM escolas WHERE Email = @email ", Banco.Connection))
                {
                    cmd.Parameters.AddWithValue("@email", Email);

                    var result = cmd.ExecuteScalar(); // pega o primeiro valor da consulta

                    if (result != null)
                    {
                        HashBanco = result.ToString(); // senha (hash) armazenada no banco
                    }
                }
                Banco.CloseConnection();
            }
            catch
            {
                MessageBox.Show("Alguma coisa ai deu muito errada! ");
            }
        }

    }
}
